// SellAuth HTTP notification receiver. Verifies the X-Signature HMAC-SHA256
// header against the webhook secret, fetches the full invoice from the
// SellAuth API, and marks the matching order paid only when the paid amount
// covers the order total.
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/sellauth-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SELLAUTH_WEBHOOK_SECRET;
        const apiKey = process.env.SELLAUTH_API_KEY;
        const shopId = process.env.SELLAUTH_SHOP_ID;
        if (!secret || !apiKey || !shopId) {
          console.error("[sellauth-webhook] missing configuration");
          return new Response("Not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const signature = (request.headers.get("x-signature") || "").trim();
        if (!signature) {
          return new Response("Missing signature", { status: 401 });
        }

        const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
        let valid = false;
        try {
          const a = Buffer.from(signature, "hex");
          const b = Buffer.from(expected, "hex");
          valid = a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
        } catch {
          valid = false;
        }
        if (!valid) {
          console.error("[sellauth-webhook] invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: { event?: string; data?: { invoice_id?: number | string } };
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const event = String(payload?.event || "");
        const invoiceId = payload?.data?.invoice_id;
        if (!event.startsWith("NOTIFICATION.SHOP_INVOICE") || !invoiceId) {
          return new Response("ok");
        }

        // Fetch the full invoice — notifications only carry IDs.
        let invoice: {
          id?: number | string;
          status?: string;
          price?: string | number;
          paid?: string | number;
          currency?: string;
          email?: string;
          metadata?: Record<string, string>;
        } | null = null;
        try {
          const resp = await fetch(
            `https://api.sellauth.com/v1/shops/${shopId}/invoices/${invoiceId}`,
            { headers: { Authorization: `Bearer ${apiKey}` } },
          );
          if (resp.ok) {
            const json = (await resp.json().catch(() => ({}))) as { data?: typeof invoice } & typeof invoice;
            invoice = (json?.data ?? json) as typeof invoice;
          }
        } catch (e) {
          console.error("[sellauth-webhook] invoice fetch failed", e);
        }
        if (!invoice) {
          return new Response("Invoice unavailable", { status: 502 });
        }

        const orderId = invoice.metadata?.order_id || "";
        if (!orderId) {
          // Not one of our orders (e.g. a direct SellAuth storefront sale).
          return new Response("ok");
        }

        const status = String(invoice.status || "").toLowerCase();
        const isPaid = status === "completed" || status === "partially_completed";
        const isFailed = status === "cancelled" || status === "failed" || status === "refunded";
        if (!isPaid && !isFailed) {
          return new Response("ok");
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const { data: existing } = await supabase
          .from("orders")
          .select("id, status, amount_cents, customer_email, customer_name, order_number, items")
          .eq("id", orderId)
          .maybeSingle();
        if (!existing) {
          console.warn("[sellauth-webhook] order not found", orderId);
          return new Response("ok");
        }
        if (existing.status === "paid" && isPaid) {
          return new Response("ok");
        }

        // SECURITY: never mark an order paid for less than it costs.
        // Allow only a 1-rupee rounding allowance.
        if (isPaid) {
          const expectedCents = Number(existing.amount_cents ?? 0);
          const paidAmount = Number(invoice.paid ?? invoice.price);
          if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
            console.error("[sellauth-webhook] paid invoice without usable amount", {
              orderId,
              paid: invoice.paid,
            });
            return new Response("Amount mismatch", { status: 409 });
          }
          const paidCents = Math.round(paidAmount * 100);
          if (paidCents < expectedCents - 100) {
            console.error("[sellauth-webhook] underpaid order, refusing to mark paid", {
              orderId,
              paidCents,
              expectedCents,
            });
            await supabase
              .from("orders")
              .update({
                payment_status: "pending",
                status: "pending",
                raw_callback: { ...invoice, underpaid: true, expected_cents: expectedCents },
              })
              .eq("id", orderId);
            return new Response("Amount mismatch", { status: 409 });
          }
        }

        const patch: Record<string, unknown> = {
          payment_status: isPaid ? "paid" : "failed",
          status: isPaid ? "paid" : "failed",
          raw_callback: invoice,
        };
        if (isPaid) {
          patch.paid_at = new Date().toISOString();
          patch.order_status = "processing";
        }
        patch.payment_ref = String(invoiceId);

        const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
        if (error) {
          console.error("[sellauth-webhook] update failed", error);
          return new Response("DB error", { status: 500 });
        }

        if (isPaid) {
          const amountInr = (existing.amount_cents ?? 0) / 100;
          try {
            const { postOrderPaidToDiscord } = await import(
              "@/lib/discord-notify.server"
            );
            postOrderPaidToDiscord({
              orderId,
              provider: "sellauth",
              amountInr,
              paymentRef: String(invoiceId),
            });
          } catch (e) {
            console.error("[sellauth-webhook] discord notify failed", e);
          }

          if (existing.customer_email) {
            try {
              const { sendTransactionalInternal } = await import(
                "@/lib/email/send-transactional.server"
              );
              const items = Array.isArray(existing.items)
                ? (existing.items as Array<Record<string, unknown>>).map((li) => ({
                    name: String(li.title ?? li.name ?? "Item"),
                    qty: Number(li.qty ?? 1),
                    price: Number(li.price ?? 0),
                    edition: (li.edition_name as string | undefined) ?? null,
                  }))
                : [];
              await sendTransactionalInternal({
                templateName: "order-confirmation",
                recipientEmail: existing.customer_email,
                idempotencyKey: `order-confirm-${orderId}`,
                templateData: {
                  orderId,
                  orderNumber: existing.order_number ?? null,
                  customerName: existing.customer_name ?? undefined,
                  items,
                  amountInr,
                  provider: "sellauth",
                  paymentRef: String(invoiceId),
                },
              });
            } catch (e) {
              console.error("[sellauth-webhook] confirmation email failed", e);
            }
          }
        }

        return new Response("ok");
      },
    },
  },
});
