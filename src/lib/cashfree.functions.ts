// Cashfree Orders API integration for hosted checkout.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string(),
  qty: z.number().int().positive(),
  price: z.number().nonnegative(),
  variantId: z.string().optional(),
  product_id: z.string().optional(),
  edition_name: z.string().max(60).optional(),
  options: z.record(z.string().max(60), z.string().max(60)).optional(),
  edition_price_cents: z.number().int().nonnegative().optional(),
});

const shippingSchema = z.object({
  line1: z.string().trim().min(1),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postal_code: z.string().trim().min(3),
  country: z.string().trim().default("IN"),
}).optional();

export const createCashfreePaymentLink = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      items: z.array(itemSchema).min(1),
      amount: z.number().positive(),
      email: z.string().email(),
      phone: z.string().trim().min(10),
      name: z.string().trim().min(1),
      discord: z.string().trim().optional(),
      shipping: shippingSchema,
      coupon_code: z.string().trim().optional(),
    }).parse(d),

  )
  .handler(async ({ data }) => {
    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    const cfOrdersEndpoint = "https://api.cashfree.com/pg/orders";
    if (!appId || !secret) {
      return { ok: false as const, error: "Cashfree is not configured." };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // SECURITY: recompute prices/amount server-side; never trust client values.
    const { resolvePricing } = await import("./pricing.server");
    const priced = await resolvePricing(data.items, data.coupon_code);
    if (!priced.ok) {
      return { ok: false as const, error: priced.error };
    }
    const serverAmount = priced.totalCents / 100;
    if (serverAmount <= 0) {
      return { ok: false as const, error: "Order total must be greater than zero." };
    }

    // 1. Create pending order row (server-computed totals + line items)
    const { data: row, error } = await supabase
      .from("orders")
      .insert({
        customer_email: data.email,
        customer_name: data.name,
        customer_phone: data.phone,
        customer_discord: data.discord ?? null,
        shipping_address: data.shipping ?? null,
        items: priced.lineItems,
        amount_cents: priced.totalCents,
        total_amount: priced.totalCents,
        status: "pending",
        order_status: "pending",
        payment_status: "pending",
        payment_provider: "cashfree",
        raw_callback: priced.appliedCoupon
          ? { coupon: priced.appliedCoupon, discount_cents: priced.discountCents }
          : null,
      })
      .select("id, order_number")
      .single();
    if (error || !row) {
      return { ok: false as const, error: error?.message || "Failed to create order" };
    }

    // Fire-and-forget Discord notification (never blocks checkout).
    try {
      const { postNewOrderToDiscord } = await import("./discord-notify.server");
      postNewOrderToDiscord({
        orderId: row.id,
        orderNumber: (row as { order_number?: string | null }).order_number ?? null,
        provider: "cashfree",
        amountInr: serverAmount,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerDiscord: data.discord,
        shipping: data.shipping ?? null,
        items: priced.lineItems.map((li) => ({
          name: li.title, qty: li.qty, price: li.price,
        })),
      });
    } catch (e) {
      console.error("[cashfree] discord notify failed", e);
    }

    // 2. Build return URL. Cashfree only opens checkout for approved domains,
    // so never use localhost / preview hosts for the hosted payment return URL.
    let origin = "https://trxshop.xyz";
    try {
      const host = getRequestHost();
      if (host === "trxshop.xyz" || host === "www.trxshop.xyz") {
        origin = `https://${host}`;
      }
    } catch {}

    // Cashfree order_id must be alphanumeric/_/- and <= 45 chars.
    const cfOrderId = `trx_${row.id.replace(/-/g, "").slice(0, 24)}_${Date.now().toString(36)}`.slice(0, 45);
    const phone = data.phone.replace(/\D/g, "").slice(-10) || "9999999999";
    const email = data.email;
    const customerName = data.name.slice(0, 40);
    const customerId = `cust_${row.id.replace(/-/g, "").slice(0, 24)}`;

    try {
      const returnUrl = `${origin}/order/${row.id}?cf_order_id={order_id}`;

      const resp = await fetch(cfOrdersEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": appId,
          "x-client-secret": secret,
        },
        body: JSON.stringify({
          order_id: cfOrderId,
          order_amount: Number(serverAmount.toFixed(2)),
          order_currency: "INR",
          customer_details: {
            customer_id: customerId,
            customer_email: email,
            customer_phone: phone,
            customer_name: customerName,
          },
          order_meta: {
            return_url: returnUrl,
            notify_url: `${origin}/api/public/cashfree-webhook`,
          },
          order_tags: { order_id: row.id, internal_order_id: row.id },
          order_note: `TRXSHOP order ${row.id}`,
        }),
      });

      const json = (await resp.json().catch(() => ({}))) as {
        payment_session_id?: string;
        order_id?: string;
        cf_order_id?: string | number;
        message?: string;
        code?: string;
        type?: string;
      };

      if (!resp.ok || !json.payment_session_id) {
        const msg = json?.message || `Cashfree error (${resp.status})`;
        await supabase.from("orders").update({ status: "failed", payment_status: "failed" }).eq("id", row.id);
        console.error("[cashfree] order create failed", { status: resp.status, json });
        return { ok: false as const, error: msg };
      }

      await supabase
        .from("orders")
        .update({
          payment_ref: json.order_id || (json.cf_order_id ? String(json.cf_order_id) : cfOrderId),
        })
        .eq("id", row.id);

      return {
        ok: true as const,
        orderId: row.id,
        paymentSessionId: json.payment_session_id,
        returnUrl,
        cfOrderId: json.order_id ?? cfOrderId,
      };
    } catch (e) {
      console.error("[cashfree] network error", e);
      await supabase.from("orders").update({ status: "failed", payment_status: "failed" }).eq("id", row.id);
      return {
        ok: false as const,
        error: (e as Error)?.message || "Network error contacting Cashfree.",
      };
    }
  });
