// Server functions for orders: place order (with items), list mine, admin list/update.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveOptions } from "@/lib/option-pricing";

const lineSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(200),
  qty: z.number().int().positive().max(99),
  // unit price in INR (decimal); we'll convert to cents server-side
});

const placeInput = z.object({
  email: z.string().email(),
  items: z.array(z.object({
    product_id: z.string().uuid().optional(),
    variantId: z.string().optional(),
    name: z.string().min(1).max(200),
    qty: z.number().int().positive().max(99),
    edition_name: z.string().max(60).optional(),
  options: z.record(z.string().max(60), z.string().max(60)).optional(),
  })).min(1).max(50),
  coupon_code: z.string().trim().optional(),
  customer_name: z.string().trim().max(120).optional(),
  customer_phone: z.string().trim().max(40).optional(),
  customer_discord: z.string().trim().max(60).optional(),
  shipping_address: z.object({
    line1: z.string().max(200).optional(),
    line2: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(80).optional(),
    postal_code: z.string().max(20).optional(),
    country: z.string().max(80).optional(),
  }).optional(),
  payment_method_label: z.string().max(120).optional(),
});

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// PLACE ORDER — public (sign-in optional); prices fetched from DB, never trusted from client.
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => placeInput.parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Fetch product prices from DB by id (preferred) or by variantId fallback
    const ids = data.items.map((i) => i.product_id || i.variantId).filter(Boolean) as string[];
    const { data: products } = await admin
      .from("products")
      .select("id, title, price_cents, active, stock, editions, option_groups")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const byId = new Map((products ?? []).map((p) => [p.id as string, p]));

    const lineItems: Array<{
      product_id: string | null;
      title: string;
      quantity: number;
      price_cents: number;
      edition_name: string | null;
      edition_price_cents: number | null;
    }> = [];
    let subtotalCents = 0;
    for (const it of data.items) {
      const pid = (it.product_id || it.variantId) as string | undefined;
      const p = pid ? byId.get(pid) : null;
      if (!p || !p.active) {
        return { ok: false as const, error: `Product unavailable: ${it.name}` };
      }
      let unitCents = p.price_cents as number;
      let editionName: string | null = null;
      if (it.edition_name) {
        const raw = Array.isArray(p.editions) ? (p.editions as Array<{ name?: string; price_cents?: number }>) : [];
        const match = raw.find((e) => typeof e?.name === "string" && e.name === it.edition_name);
        if (!match) {
          return { ok: false as const, error: `Edition unavailable: ${it.edition_name}` };
        }
        unitCents = Number(match.price_cents) || unitCents;
        editionName = match.name as string;
      }
      const optRes = resolveOptions((p as { option_groups?: unknown }).option_groups, it.options);
      if (!optRes.ok) {
        return { ok: false as const, error: optRes.error ?? "Invalid options." };
      }
      if (optRes.priceCents != null) unitCents = optRes.priceCents;
      const optionSuffix = optRes.suffix;
      lineItems.push({
        product_id: p.id as string,
        title: `${p.title as string}${optionSuffix}`,
        quantity: it.qty,
        price_cents: unitCents,
        edition_name: editionName,
        edition_price_cents: editionName ? unitCents : null,
      });
      subtotalCents += unitCents * it.qty;
    }

    // Apply coupon
    let discountCents = 0;
    let appliedCode: string | null = null;
    if (data.coupon_code) {
      const { data: cRow } = await admin
        .from("coupons")
        .select("code, discount_type, discount_value, active, expiry_date, usage_limit, usage_count")
        .ilike("code", data.coupon_code)
        .eq("active", true)
        .maybeSingle();
      const valid = cRow
        && (!cRow.expiry_date || new Date(cRow.expiry_date as string) > new Date())
        && (cRow.usage_limit == null || (cRow.usage_count ?? 0) < cRow.usage_limit);
      if (valid && cRow) {
        appliedCode = cRow.code as string;
        if (cRow.discount_type === "percent") {
          discountCents = Math.min(subtotalCents, Math.floor((subtotalCents * (cRow.discount_value as number)) / 100));
        } else {
          discountCents = Math.min(subtotalCents, (cRow.discount_value as number) * 100);
        }
      }
    }
    const totalCents = Math.max(0, subtotalCents - discountCents);

    // Get user_id from incoming Authorization (best-effort)
    let userId: string | null = null;
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const auth = getRequestHeader("authorization");
      const token = auth?.replace(/^Bearer\s+/i, "");
      if (token) {
        const userClient = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
          );
        const { data: u } = await userClient.auth.getUser(token);
        userId = u.user?.id ?? null;
      }
    } catch { /* anon */ }

    const { data: order, error: oErr } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        customer_id: userId,
        customer_email: data.email,
        customer_name: data.customer_name ?? null,
        customer_phone: data.customer_phone ?? null,
        customer_discord: data.customer_discord ?? null,
        shipping_address: data.shipping_address ?? null,
        items: lineItems,
        amount_cents: totalCents,
        total_amount: totalCents,
        status: "pending",
        order_status: "pending",
        payment_status: "pending",
        payment_provider: "manual",
        raw_callback: {
          ...(appliedCode ? { coupon: appliedCode, discount_cents: discountCents } : {}),
          ...(data.payment_method_label ? { payment_method_label: data.payment_method_label } : {}),
        },
      })
      .select("id")
      .single();
    if (oErr || !order) {
      return { ok: false as const, error: oErr?.message || "Failed to create order" };
    }

    const { error: iErr } = await admin.from("order_items").insert(
      lineItems.map((li) => ({
        order_id: order.id as string,
        product_id: li.product_id,
        title: li.title,
        quantity: li.quantity,
        price_cents: li.price_cents,
        edition_name: li.edition_name,
        edition_price_cents: li.edition_price_cents,
      })),
    );
    if (iErr) {
      return { ok: false as const, error: iErr.message };
    }

    return { ok: true as const, orderId: order.id as string };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string } | undefined)?.email ?? null;
    const orFilter = [
      `user_id.eq.${context.userId}`,
      `customer_id.eq.${context.userId}`,
      ...(email ? [`customer_email.eq.${email}`] : []),
    ].join(",");
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total_amount, amount_cents, order_status, payment_status, status, created_at, customer_email, items")
      .or(orFilter)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];

    // Enrich with cover_image from products for the first line item
    const ids = new Set<string>();
    for (const o of rows) {
      const items = Array.isArray(o.items) ? (o.items as Array<{ product_id?: string }>) : [];
      for (const it of items) if (it?.product_id) ids.add(it.product_id);
    }
    let imgById = new Map<string, string | null>();
    if (ids.size) {
      const { data: prods } = await context.supabase
        .from("products").select("id, cover_image").in("id", Array.from(ids));
      imgById = new Map((prods ?? []).map((p) => [p.id as string, (p.cover_image as string | null) ?? null]));
    }
    return rows.map((o) => {
      const items = Array.isArray(o.items) ? (o.items as Array<{ product_id?: string; name?: string; qty?: number }>) : [];
      const first = items[0];
      return {
        ...o,
        cover_image: first?.product_id ? imgById.get(first.product_id) ?? null : null,
        item_count: items.reduce((s, i) => s + (i.qty ?? 0), 0),
        first_item_name: first?.name ?? null,
        first_product_id: first?.product_id ?? null,
      };
    });
  });

export const getOrderWithItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return { ok: false as const, error: "Not found" };
    const { data: items } = await context.supabase
      .from("order_items").select("*").eq("order_id", data.id);
    const rows = items ?? [];
    const pids = Array.from(new Set(rows.map((r) => r.product_id).filter(Boolean))) as string[];
    let imgById = new Map<string, string | null>();
    if (pids.length) {
      const { data: prods } = await context.supabase
        .from("products").select("id, cover_image").in("id", pids);
      imgById = new Map((prods ?? []).map((p) => [p.id as string, (p.cover_image as string | null) ?? null]));
    }
    const enriched = rows.map((r) => ({ ...r, cover_image: r.product_id ? imgById.get(r.product_id as string) ?? null : null }));
    return { ok: true as const, order, items: enriched };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, customer_email, total_amount, amount_cents, order_status, payment_status, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    order_status: z.enum(["pending", "processing", "fulfilled", "cancelled", "refunded", "unfulfilled", "in_progress", "on_hold", "delivered"]).optional(),
    payment_status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = {};
    if (data.order_status) patch.order_status = data.order_status;
    if (data.payment_status) {
      patch.payment_status = data.payment_status;
      patch.status = data.payment_status === "paid" ? "paid" : data.payment_status;
      if (data.payment_status === "paid") patch.paid_at = new Date().toISOString();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;

    // Read prior status so we only fire the delivered email on transition.
    let priorStatus: string | null = null;
    if (data.order_status === "delivered") {
      const { data: prior } = await sb
        .from("orders")
        .select("order_status")
        .eq("id", data.id)
        .maybeSingle();
      priorStatus = (prior?.order_status as string | null) ?? null;
    }

    const { error } = await sb.from("orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.order_status === "delivered" && priorStatus !== "delivered") {
      try {
        const { data: row } = await sb
          .from("orders")
          .select("customer_email, customer_name, order_number, amount_cents, items, payment_provider, payment_ref")
          .eq("id", data.id)
          .maybeSingle();
        if (row?.customer_email) {
          const { sendTransactionalInternal } = await import(
            "@/lib/email/send-transactional.server"
          );
          const items = Array.isArray(row.items)
            ? (row.items as Array<Record<string, unknown>>).map((li) => ({
                name: String(li.title ?? li.name ?? "Item"),
                qty: Number(li.qty ?? li.quantity ?? 1),
                price:
                  li.price != null
                    ? Number(li.price)
                    : li.price_cents != null
                      ? Number(li.price_cents) / 100
                      : 0,
                edition: (li.edition_name as string | undefined) ?? null,
              }))
            : [];
          const amountInr = (Number(row.amount_cents) || 0) / 100;
          await sendTransactionalInternal({
            templateName: "order-delivered",
            recipientEmail: row.customer_email as string,
            idempotencyKey: `order-delivered-${data.id}`,
            templateData: {
              orderId: data.id,
              orderNumber: row.order_number ?? null,
              customerName: row.customer_name ?? undefined,
              items,
              amountInr,
              price: amountInr.toFixed(2),
              provider: row.payment_provider ?? undefined,
              paymentRef: row.payment_ref ?? null,
            },
          });
        }
      } catch (e) {
        console.error("[adminUpdateOrder] delivered email failed", e);
      }
    }

    return { ok: true as const, id: data.id };
  });
