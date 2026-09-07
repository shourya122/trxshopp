// Order creation + OxaPay invoice creation.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().optional(),
  qty: z.number().int().positive(),
  price: z.number().nonnegative().optional(),
  variantId: z.string().optional(),
  product_id: z.string().optional(),
  edition_name: z.string().max(60).optional(),
  options: z.record(z.string().max(60), z.string().max(60)).optional(),
});

const OXAPAY_ENDPOINT = "https://api.oxapay.com/v1/payment/invoice";

const shippingSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
}).partial().optional();

export const createCryptoInvoice = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      items: z.array(itemSchema).min(1),
      amount: z.number().positive().optional(),
      email: z.string().email().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
      discord: z.string().optional(),
      shipping: shippingSchema,
      coupon_code: z.string().trim().optional(),
    }).parse(d),
  )

  .handler(async ({ data }) => {
    const apiKey = process.env.OXAPAY_MERCHANT_API_KEY || process.env.OXAPAY_MERCHANT_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Crypto gateway is not configured." };
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

    // 1. Create order row (server-computed totals + line items)
    const { data: row, error } = await supabase
      .from("orders")
      .insert({
        customer_name: data.name ?? null,
        customer_email: data.email ?? "",
        customer_phone: data.phone ?? null,
        customer_discord: data.discord ?? null,
        shipping_address: data.shipping ?? null,
        items: priced.lineItems,
        amount_cents: priced.totalCents,
        status: "pending",
        payment_provider: "oxapay",
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
        provider: "oxapay",
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
      console.error("[oxapay] discord notify failed", e);
    }

    // 2. Build callback/return URLs from current host
    let origin = "https://trxshop.xyz";
    try {
      const host = getRequestHost();
      if (host) origin = `https://${host}`;
    } catch {}

    // 3. Call OxaPay to mint an invoice
    const description =
      priced.lineItems.map((i) => `${i.qty}x ${i.title}`).join(", ").slice(0, 200) ||
      `TRXSHOP order ${row.id}`;

    try {
      const resp = await fetch(OXAPAY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          merchant_api_key: apiKey,
        },
        body: JSON.stringify({
          amount: Number(serverAmount.toFixed(2)),
          currency: "INR",
          lifetime: 60,
          fee_paid_by_payer: 1,
          under_paid_coverage: 2.5,
          to_currency: "USDT",
          description,
          order_id: row.id,
          email: data.email || undefined,
          callback_url: `${origin}/api/public/oxapay-webhook`,
          return_url: `${origin}/order/${row.id}`,
        }),
      });

      const json = (await resp.json().catch(() => ({}))) as {
        status?: number;
        message?: string;
        error?: { message?: string; type?: string };
        data?: { track_id?: string | number; payment_url?: string };
      };

      const payUrl = json?.data?.payment_url;
      const trackId = json?.data?.track_id;

      if (!resp.ok || !payUrl) {
        const msg =
          json?.error?.message ||
          json?.message ||
          `OxaPay error (${resp.status})`;
        // Mark order as failed so it isn't left silently pending
        await supabase
          .from("orders")
          .update({ status: "failed" })
          .eq("id", row.id);
        console.error("[oxapay] invoice failed", { status: resp.status, json });
        return { ok: false as const, error: msg };
      }

      await supabase
        .from("orders")
        .update({
          pay_link: payUrl,
          payment_ref: trackId ? String(trackId) : null,
        })
        .eq("id", row.id);

      return {
        ok: true as const,
        orderId: row.id,
        payLink: payUrl,
        trackId: trackId ? String(trackId) : null,
      };
    } catch (e) {
      console.error("[oxapay] network error", e);
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", row.id);
      return {
        ok: false as const,
        error: (e as Error)?.message || "Network error contacting crypto gateway.",
      };
    }
  });

export const getCryptoOrder = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: row, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_email, customer_name, customer_phone, customer_discord, shipping_address, items, amount_cents, status, payment_status, payment_provider, payment_ref, pay_link, raw_callback, created_at, paid_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) {
      return { ok: false as const, error: error?.message || "Order not found" };
    }

    // Attach product cover images to items where possible
    const items = Array.isArray(row.items) ? (row.items as Array<Record<string, unknown>>) : [];
    const pids = Array.from(
      new Set(items.map((i) => (i.product_id as string | undefined)).filter(Boolean) as string[]),
    );
    let imgById = new Map<string, string | null>();
    if (pids.length) {
      const { data: prods } = await supabase
        .from("products").select("id, cover_image").in("id", pids);
      imgById = new Map((prods ?? []).map((p) => [p.id as string, (p.cover_image as string | null) ?? null]));
    }
    const enrichedItems = items.map((li) => ({
      ...li,
      cover_image: li.product_id ? imgById.get(li.product_id as string) ?? null : null,
    }));

    const rawCallback = (row.raw_callback ?? null) as Record<string, unknown> | null;
    return {
      ok: true as const,
      order: {
        id: row.id,
        order_number: (row as { order_number?: string }).order_number ?? null,
        customer_email: row.customer_email,
        customer_name: (row as { customer_name?: string | null }).customer_name ?? null,
        customer_phone: (row as { customer_phone?: string | null }).customer_phone ?? null,
        customer_discord: (row as { customer_discord?: string | null }).customer_discord ?? null,
        shipping_address: (row as { shipping_address?: Record<string, string> | null }).shipping_address ?? null,
        items: enrichedItems,
        amount_inr: (row.amount_cents ?? 0) / 100,
        status: row.status,
        payment_status: (row as { payment_status?: string | null }).payment_status ?? null,
        payment_provider: (row as { payment_provider?: string | null }).payment_provider ?? null,
        payment_ref: (row as { payment_ref?: string | null }).payment_ref ?? null,
        payment_method_label: (rawCallback?.payment_method_label as string | undefined) ?? null,
        pay_link: row.pay_link,
        created_at: row.created_at,
        paid_at: row.paid_at,
      },
    };
  });
