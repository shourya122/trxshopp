// OxaPay webhook receiver. Verifies HMAC-SHA512 signature and updates order status.
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/oxapay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          process.env.OXAPAY_MERCHANT_API_KEY || process.env.OXAPAY_MERCHANT_KEY;
        if (!apiKey) {
          console.error("[oxapay-webhook] missing api key");
          return new Response("Not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const signature = (request.headers.get("hmac") || "").trim();
        if (!signature) {
          return new Response("Missing signature", { status: 401 });
        }

        const expected = createHmac("sha512", apiKey).update(rawBody).digest("hex");
        let valid = false;
        try {
          const a = Buffer.from(signature, "hex");
          const b = Buffer.from(expected, "hex");
          valid = a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
        } catch {
          valid = false;
        }
        if (!valid) {
          console.error("[oxapay-webhook] invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: {
          type?: string;
          status?: string;
          track_id?: string | number;
          order_id?: string;
          amount?: number | string;
        };
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const orderId = payload?.order_id || "";
        const trackId = payload?.track_id ? String(payload.track_id) : "";
        const status = String(payload?.status || "").toLowerCase();

        if (!orderId) {
          console.warn("[oxapay-webhook] no order_id in payload", payload?.type);
          return new Response("ok");
        }

        let payment_status: "paid" | "failed" | "pending" = "pending";
        if (status === "paid") payment_status = "paid";
        else if (status === "expired" || status === "failed") payment_status = "failed";

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        // Idempotency: if already paid, don't re-post to Discord.
        const { data: existing } = await supabase
          .from("orders")
          .select("id, status, amount_cents, customer_email, customer_name, order_number, items")
          .eq("id", orderId)
          .maybeSingle();
        if (!existing) {
          console.warn("[oxapay-webhook] order not found", orderId);
          return new Response("ok");
        }
        if (existing.status === "paid" && payment_status === "paid") {
          return new Response("ok");
        }

        const patch: Record<string, unknown> = {
          payment_status,
          status:
            payment_status === "paid"
              ? "paid"
              : payment_status === "failed"
                ? "failed"
                : "pending",
          raw_callback: payload,
        };
        if (payment_status === "paid") {
          patch.paid_at = new Date().toISOString();
          patch.order_status = "processing";
        }
        if (trackId) patch.payment_ref = trackId;

        const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
        if (error) {
          console.error("[oxapay-webhook] update failed", error);
          return new Response("DB error", { status: 500 });
        }

        if (payment_status === "paid") {
          const amountInr = (existing.amount_cents ?? 0) / 100;
          try {
            const { postOrderPaidToDiscord } = await import(
              "@/lib/discord-notify.server"
            );
            postOrderPaidToDiscord({
              orderId,
              provider: "oxapay",
              amountInr,
              paymentRef: trackId || undefined,
            });
          } catch (e) {
            console.error("[oxapay-webhook] discord notify failed", e);
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
                  provider: "oxapay",
                  paymentRef: trackId || undefined,
                },
              });
            } catch (e) {
              console.error("[oxapay-webhook] confirmation email failed", e);
            }
          }
        }

        return new Response("ok");
      },
    },
  },
});
