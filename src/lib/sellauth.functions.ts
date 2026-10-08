// Order creation + SellAuth hosted checkout session.
// Prices are always recomputed server-side via resolvePricing — never trust the client.
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

const shippingSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
}).partial().optional();

export const createSellauthCheckout = createServerFn({ method: "POST" })
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
    const apiKey = process.env.SELLAUTH_API_KEY;
    const shopId = process.env.SELLAUTH_SHOP_ID;
    if (!apiKey || !shopId) {
      return { ok: false as const, error: "SellAuth checkout is not configured." };
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
        payment_provider: "sellauth",
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
        provider: "sellauth",
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
      console.error("[sellauth] discord notify failed", e);
    }

    // 2. Build the SellAuth cart. Products linked to a SellAuth product/variant
    //    in the admin panel are sent as catalog items (SellAuth delivers them
    //    automatically from its stock). Everything else is sent as a custom
    //    item with the server-computed INR price.
    const productIds = Array.from(new Set(priced.lineItems.map((li) => li.product_id)));
    const { data: prows } = await supabase
      .from("products")
      .select("id, sellauth_product_id, editions")
      .in("id", productIds);
    const sellauthById = new Map(
      (prows ?? []).map((p) => [
        p.id as string,
        {
          productId: (p as { sellauth_product_id?: number | null }).sellauth_product_id ?? null,
          editions: Array.isArray(p.editions)
            ? (p.editions as Array<{ name?: string; sellauth_variant_id?: number | null }>)
            : [],
        },
      ]),
    );

    const cart: Array<Record<string, unknown>> = [];
    let hasCustom = false;
    for (const li of priced.lineItems) {
      const mapping = sellauthById.get(li.product_id);
      const saProductId = mapping?.productId ?? null;
      const saVariantId = li.edition_name
        ? mapping?.editions.find((e) => e.name === li.edition_name)?.sellauth_variant_id ?? null
        : null;
      if (saProductId) {
        const item: Record<string, unknown> = { productId: saProductId, quantity: li.qty };
        if (saVariantId) item.variantId = saVariantId;
        cart.push(item);
      } else {
        hasCustom = true;
        cart.push({
          name: li.title.slice(0, 120),
          price: Number((li.price_cents / 100).toFixed(2)),
          quantity: li.qty,
        });
      }
    }

    // 3. Create the SellAuth checkout session
    try {
      const resp = await fetch(`https://api.sellauth.com/v1/shops/${shopId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          cart,
          ...(hasCustom ? { currency: "INR" } : {}),
          email: data.email || undefined,
          metadata: { order_id: row.id },
        }),
      });

      const json = (await resp.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        invoice_id?: number | string;
        url?: string;
        invoice_url?: string;
      };

      const payUrl = json?.url || json?.invoice_url;
      if (!resp.ok || !payUrl) {
        const msg = json?.message || `SellAuth error (${resp.status})`;
        await supabase.from("orders").update({ status: "failed" }).eq("id", row.id);
        console.error("[sellauth] checkout failed", { status: resp.status, json });
        return { ok: false as const, error: msg };
      }

      await supabase
        .from("orders")
        .update({
          pay_link: payUrl,
          payment_ref: json.invoice_id ? String(json.invoice_id) : null,
        })
        .eq("id", row.id);

      return {
        ok: true as const,
        orderId: row.id,
        payLink: payUrl,
        invoiceId: json.invoice_id ? String(json.invoice_id) : null,
      };
    } catch (e) {
      console.error("[sellauth] network error", e);
      await supabase.from("orders").update({ status: "failed" }).eq("id", row.id);
      return {
        ok: false as const,
        error: (e as Error)?.message || "Network error contacting SellAuth.",
      };
    }
  });
