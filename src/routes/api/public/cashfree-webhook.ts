// Cashfree webhook receiver. Verifies HMAC-SHA256 signature and updates order status.
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/cashfree-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CASHFREE_SECRET_KEY;
        if (!secret) {
          console.error("[cashfree-webhook] missing secret");
          return new Response("Not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get("x-webhook-signature") || "";
        const timestamp = request.headers.get("x-webhook-timestamp") || "";

        if (!signature || !timestamp) {
          return new Response("Missing signature", { status: 401 });
        }

        const expected = createHmac("sha256", secret)
          .update(timestamp + rawBody)
          .digest("base64");

        let valid = false;
        try {
          const a = Buffer.from(signature);
          const b = Buffer.from(expected);
          valid = a.length === b.length && timingSafeEqual(a, b);
        } catch {
          valid = false;
        }
        if (!valid) {
          console.error("[cashfree-webhook] invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: {
          type?: string;
          data?: {
            order?: { order_id?: string; order_amount?: number; order_tags?: Record<string, string> };
            payment?: { payment_status?: string; cf_payment_id?: string | number };
            link?: { link_id?: string; link_status?: string; link_notes?: Record<string, string> };
          };
        };
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const type = payload?.type || "";
        const linkStatus = payload?.data?.link?.link_status;
        const paymentStatus = payload?.data?.payment?.payment_status;
        const orderId =
          payload?.data?.link?.link_notes?.order_id ||
          payload?.data?.order?.order_tags?.order_id ||
          "";
        const cfPaymentId = payload?.data?.payment?.cf_payment_id;

        if (!orderId) {
          console.warn("[cashfree-webhook] no order_id in payload", type);
          return new Response("ok"); // ack anyway
        }

        // Map status
        let payment_status: "paid" | "failed" | "pending" = "pending";
        const s = (paymentStatus || linkStatus || "").toUpperCase();
        if (s === "SUCCESS" || s === "PAID") payment_status = "paid";
        else if (s === "FAILED" || s === "USER_DROPPED" || s === "CANCELLED" || s === "EXPIRED")
          payment_status = "failed";

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        // SECURITY: never mark an order paid for less than it costs.
        if (payment_status === "paid") {
          const { data: amountRow } = await supabase
            .from("orders")
            .select("amount_cents")
            .eq("id", orderId)
            .maybeSingle();
          const expectedCents = Number(amountRow?.amount_cents ?? 0);
          const paidInr = Number(payload?.data?.order?.order_amount);
          if (expectedCents > 0) {
            if (!Number.isFinite(paidInr) || paidInr <= 0) {
              console.error("[cashfree-webhook] paid callback without usable amount", { orderId });
              return new Response("Amount missing", { status: 409 });
            }
            // 1-rupee rounding allowance only.
            if (Math.round(paidInr * 100) < expectedCents - 100) {
              console.error("[cashfree-webhook] underpaid order, refusing to mark paid", {
                orderId,
                paidCents: Math.round(paidInr * 100),
                expectedCents,
              });
              await supabase
                .from("orders")
                .update({
                  payment_status: "pending",
                  status: "pending",
                  raw_callback: { ...payload, underpaid: true, expected_cents: expectedCents },
                })
                .eq("id", orderId);
              return new Response("Amount mismatch", { status: 409 });
            }
          }
        }

        const patch: Record<string, unknown> = {
          payment_status,
          status: payment_status === "paid" ? "paid" : payment_status === "failed" ? "failed" : "pending",
          raw_callback: payload,
        };
        if (payment_status === "paid") {
          patch.paid_at = new Date().toISOString();
          patch.order_status = "processing";
        }
        if (cfPaymentId) patch.payment_ref = String(cfPaymentId);


        // Idempotency: skip Discord "paid" post if the row was already paid.
        let alreadyPaid = false;
        if (payment_status === "paid") {
          const { data: existing } = await supabase
            .from("orders")
            .select("status")
            .eq("id", orderId)
            .maybeSingle();
          alreadyPaid = existing?.status === "paid";
        }

        const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
        if (error) {
          console.error("[cashfree-webhook] update failed", error);
          return new Response("DB error", { status: 500 });
        }

        if (payment_status === "paid" && !alreadyPaid) {
          const { data: row } = await supabase
            .from("orders")
            .select("amount_cents, customer_email, customer_name, order_number, items")
            .eq("id", orderId)
            .maybeSingle();
          const amountInr = (row?.amount_cents ?? 0) / 100;
          const paymentRef = cfPaymentId ? String(cfPaymentId) : undefined;

          try {
            const { postOrderPaidToDiscord } = await import(
              "@/lib/discord-notify.server"
            );
            postOrderPaidToDiscord({ orderId, provider: "cashfree", amountInr, paymentRef });
          } catch (e) {
            console.error("[cashfree-webhook] discord notify failed", e);
          }

          if (row?.customer_email) {
            try {
              const { sendTransactionalInternal } = await import(
                "@/lib/email/send-transactional.server"
              );
              const items = Array.isArray(row.items)
                ? (row.items as Array<Record<string, unknown>>).map((li) => ({
                    name: String(li.title ?? li.name ?? "Item"),
                    qty: Number(li.qty ?? 1),
                    price: Number(li.price ?? 0),
                    edition: (li.edition_name as string | undefined) ?? null,
                  }))
                : [];
              await sendTransactionalInternal({
                templateName: "order-confirmation",
                recipientEmail: row.customer_email,
                idempotencyKey: `order-confirm-${orderId}`,
                templateData: {
                  orderId,
                  orderNumber: row.order_number ?? null,
                  customerName: row.customer_name ?? undefined,
                  items,
                  amountInr,
                  provider: "cashfree",
                  paymentRef,
                },
              });
            } catch (e) {
              console.error("[cashfree-webhook] confirmation email failed", e);
            }
          }
        }

        return new Response("ok");

      },
    },
  },
});
