// Aggregated server functions for the admin panel: unified orders, dashboard
// stats, analytics trend, category rollup, product CRUD.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type AdminOrder = {
  id: string;
  source: "card" | "crypto";
  customer_email: string | null;
  amount_inr: number; // rupees
  status: string;
  payment_status: string | null;
  order_status: string | null;
  payment_provider: string | null;
  items: Array<{ name?: string; title?: string; qty?: number; quantity?: number; price?: number }>;
  created_at: string;
  paid_at: string | null;
};

// Unified orders list = orders (fiat) + crypto_orders (crypto).
export const adminListAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOrder[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: fiat }, { data: crypto }] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, customer_email, amount_cents, total_amount, status, payment_status, order_status, payment_provider, items, created_at, paid_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("crypto_orders")
        .select("id, customer_email, amount_inr, status, items, created_at, paid_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const rows: AdminOrder[] = [];
    for (const o of fiat ?? []) {
      const cents = (o.amount_cents ?? o.total_amount ?? 0) as number;
      rows.push({
        id: o.id as string,
        source: "card",
        customer_email: (o.customer_email as string) || null,
        amount_inr: Math.round(cents) / 100,
        status: (o.status as string) || "pending",
        payment_status: (o.payment_status as string) || null,
        order_status: (o.order_status as string) || null,
        payment_provider: (o.payment_provider as string) || null,
        items: (o.items as AdminOrder["items"]) || [],
        created_at: o.created_at as string,
        paid_at: (o.paid_at as string) || null,
      });
    }
    for (const o of crypto ?? []) {
      rows.push({
        id: o.id as string,
        source: "crypto",
        customer_email: (o.customer_email as string) || null,
        amount_inr: Number(o.amount_inr ?? 0),
        status: (o.status as string) || "pending",
        payment_status: null,
        order_status: null,
        payment_provider: "oxapay",
        items: (o.items as AdminOrder["items"]) || [],
        created_at: o.created_at as string,
        paid_at: (o.paid_at as string) || null,
      });
    }
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return rows;
  });

// Dashboard summary: stats + 7-day revenue sparkline + top products.
export const adminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: orders }, { data: crypto }, { count: productsCount }, { count: customersCount }] = await Promise.all([
      supabaseAdmin.from("orders").select("amount_cents, total_amount, status, payment_status, customer_email, items, created_at").limit(2000),
      supabaseAdmin.from("crypto_orders").select("amount_inr, status, customer_email, items, created_at").limit(2000),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("customers").select("id", { count: "exact", head: true }),
    ]);

    const all: Array<{ rev: number; paid: boolean; email: string | null; items: unknown[]; created_at: string }> = [];
    for (const o of orders ?? []) {
      const cents = (o.amount_cents ?? o.total_amount ?? 0) as number;
      const paid = (o.status === "paid" || o.payment_status === "paid");
      all.push({ rev: cents / 100, paid, email: (o.customer_email as string) || null, items: (o.items as unknown[]) || [], created_at: o.created_at as string });
    }
    for (const o of crypto ?? []) {
      all.push({ rev: Number(o.amount_inr ?? 0), paid: o.status === "paid", email: (o.customer_email as string) || null, items: (o.items as unknown[]) || [], created_at: o.created_at as string });
    }

    const now = Date.now();
    const dayMs = 86400000;
    const days: { d: string; v: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = now - i * dayMs;
      const d = new Date(start);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + dayMs;
      const v = all
        .filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= dayStart && t < dayEnd && o.paid;
        })
        .reduce((s, o) => s + o.rev, 0);
      days.push({ d: label, v: Math.round(v) });
    }

    const totalRevenue = all.filter((o) => o.paid).reduce((s, o) => s + o.rev, 0);
    const ordersCount = all.length;
    const paidCount = all.filter((o) => o.paid).length;
    const uniqueEmails = new Set(all.map((o) => o.email).filter(Boolean));

    // Top products by number sold
    const bag = new Map<string, { name: string; sold: number; revenue: number }>();
    for (const o of all) {
      for (const it of (o.items as Array<{ name?: string; title?: string; qty?: number; quantity?: number; price?: number }>) ?? []) {
        const name = (it.name || it.title || "Unknown") as string;
        const qty = Number(it.qty ?? it.quantity ?? 1);
        const price = Number(it.price ?? 0);
        const cur = bag.get(name) || { name, sold: 0, revenue: 0 };
        cur.sold += qty;
        cur.revenue += price * qty;
        bag.set(name, cur);
      }
    }
    const topProducts = Array.from(bag.values()).sort((a, b) => b.sold - a.sold).slice(0, 5);

    // Recent activity from last 6 records
    const recent = [...all].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6);

    return {
      totalRevenue: Math.round(totalRevenue),
      ordersCount,
      paidCount,
      customersCount: (customersCount ?? uniqueEmails.size) as number,
      productsCount: (productsCount ?? 0) as number,
      conversion: ordersCount ? (paidCount / ordersCount) * 100 : 0,
      revenueSeries: days,
      topProducts,
      recent: recent.map((r) => ({
        email: r.email,
        rev: r.rev,
        paid: r.paid,
        created_at: r.created_at,
        first: ((r.items?.[0] as { name?: string; title?: string })?.name || (r.items?.[0] as { name?: string; title?: string })?.title || "Order") as string,
      })),
    };
  });

// 30-day analytics revenue trend
export const adminAnalyticsTrend = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [{ data: orders }, { data: crypto }] = await Promise.all([
      supabaseAdmin.from("orders").select("amount_cents, total_amount, status, payment_status, created_at").gte("created_at", since),
      supabaseAdmin.from("crypto_orders").select("amount_inr, status, created_at").gte("created_at", since),
    ]);
    const now = Date.now();
    const days: { d: string; rev: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      let rev = 0;
      let cnt = 0;
      for (const o of orders ?? []) {
        const t = new Date(o.created_at as string).getTime();
        if (t >= dayStart && t < dayEnd) {
          cnt++;
          if (o.status === "paid" || o.payment_status === "paid") {
            rev += ((o.amount_cents ?? o.total_amount ?? 0) as number) / 100;
          }
        }
      }
      for (const o of crypto ?? []) {
        const t = new Date(o.created_at as string).getTime();
        if (t >= dayStart && t < dayEnd) {
          cnt++;
          if (o.status === "paid") rev += Number(o.amount_inr ?? 0);
        }
      }
      days.push({ d: String(d.getDate()), rev: Math.round(rev), orders: cnt });
    }
    return days;
  });

// Aggregated categories from products.category
export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("products").select("category, active");
    const bag = new Map<string, number>();
    for (const p of data ?? []) {
      const c = ((p.category as string) || "Uncategorised").trim();
      bag.set(c, (bag.get(c) || 0) + 1);
    }
    return Array.from(bag.entries()).map(([name, count]) => ({ name, count }));
  });

// ---- Products CRUD ----

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, title, slug, description, category, genre, developer, publisher, release_date, languages, platforms, price_cents, old_price_cents, stock, active, featured, badge, cover_image, screenshots, status, editions, editions_label, option_groups, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const productPatch = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(20000).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  genre: z.string().max(80).nullable().optional(),
  developer: z.string().max(120).nullable().optional(),
  publisher: z.string().max(120).nullable().optional(),
  release_date: z.string().max(40).nullable().optional(),
  languages: z.string().max(400).nullable().optional(),
  platforms: z.array(z.string()).optional(),
  cover_image: z.string().max(2000).nullable().optional(),
  screenshots: z.array(z.string()).optional(),
  price_cents: z.number().int().min(0).optional(),
  old_price_cents: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  badge: z.string().max(20).nullable().optional(),
  status: z.string().max(24).optional(),
  editions: z.array(z.object({
    name: z.string().trim().min(1).max(60),
    price_cents: z.number().int().min(0),
  })).max(20).optional(),
  editions_label: z.string().trim().max(60).optional(),
  option_groups: z.array(z.object({
    name: z.string().trim().min(1).max(60),
    values: z.array(z.object({
      value: z.string().trim().min(1).max(60),
      price_cents: z.number().int().min(0).nullable().optional(),
    })).max(20),
  })).max(5).optional(),

});

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), patch: productPatch }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = data.patch as Record<string, unknown>;
    const { error } = await supabaseAdmin.from("products").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200),
    category: z.string().max(80).optional(),
    price_cents: z.number().int().min(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({ ...data, active: false, stock: 0, status: "draft" })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: row.id as string };
  });

// Customer list (extended with LTV/order count) - overrides basic customers.functions version.
export const adminListCustomersRich = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: customers }, { data: orders }, { data: crypto }] = await Promise.all([
      supabaseAdmin.from("customers").select("id, email, name, role, created_at").limit(1000),
      supabaseAdmin.from("orders").select("customer_email, amount_cents, total_amount, status, payment_status, created_at"),
      supabaseAdmin.from("crypto_orders").select("customer_email, amount_inr, status, created_at"),
    ]);
    const map = new Map<string, { email: string; name: string | null; orders: number; ltv: number; last: string | null; created_at: string | null }>();
    for (const c of customers ?? []) {
      const email = ((c.email as string) || "").toLowerCase();
      if (!email) continue;
      map.set(email, {
        email, name: (c.name as string) || null, orders: 0, ltv: 0, last: null,
        created_at: (c.created_at as string) || null,
      });
    }
    const bump = (email: string | null, revIfPaid: number, created: string, paid: boolean) => {
      if (!email) return;
      const key = email.toLowerCase();
      const cur = map.get(key) || { email: key, name: null, orders: 0, ltv: 0, last: null, created_at: created };
      cur.orders += 1;
      if (paid) cur.ltv += revIfPaid;
      if (!cur.last || cur.last < created) cur.last = created;
      map.set(key, cur);
    };
    for (const o of orders ?? []) {
      const paid = o.status === "paid" || o.payment_status === "paid";
      bump((o.customer_email as string) || null, ((o.amount_cents ?? o.total_amount ?? 0) as number) / 100, o.created_at as string, paid);
    }
    for (const o of crypto ?? []) {
      bump((o.customer_email as string) || null, Number(o.amount_inr ?? 0), o.created_at as string, o.status === "paid");
    }
    return Array.from(map.values()).sort((a, b) => b.ltv - a.ltv);
  });

// -------- Notifications feed (recent activity) --------
export type AdminNotification = {
  id: string;
  kind: "order" | "crypto_order" | "customer" | "low_stock" | "out_of_stock";
  title: string;
  description?: string;
  href?: string;
  tone: string;
  created_at: string; // ISO
};

export const adminListNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminNotification[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: fiat }, { data: crypto }, { data: customers }, { data: products }] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, customer_email, amount_cents, total_amount, status, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      supabaseAdmin
        .from("crypto_orders")
        .select("id, customer_email, amount_inr, status, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      supabaseAdmin
        .from("customers")
        .select("id, email, name, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("products")
        .select("id, slug, title, stock, active, updated_at")
        .eq("active", true)
        .lte("stock", 5)
        .order("stock", { ascending: true })
        .limit(10),
    ]);

    const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    const rows: AdminNotification[] = [];

    for (const o of fiat ?? []) {
      const cents = ((o.amount_cents ?? o.total_amount ?? 0) as number);
      const paid = o.status === "paid" || o.payment_status === "paid";
      rows.push({
        id: `order:${o.id}`,
        kind: "order",
        title: `${paid ? "Paid" : "New"} order · ${inr(cents / 100)}`,
        description: (o.customer_email as string) || "Guest checkout",
        href: "/admin/orders",
        tone: paid ? "#22C55E" : "#F59E0B",
        created_at: o.created_at as string,
      });
    }
    for (const o of crypto ?? []) {
      rows.push({
        id: `crypto:${o.id}`,
        kind: "crypto_order",
        title: `${o.status === "paid" ? "Crypto paid" : "Crypto pending"} · ${inr(Number(o.amount_inr ?? 0))}`,
        description: (o.customer_email as string) || "Guest checkout",
        href: "/admin/orders",
        tone: o.status === "paid" ? "#22C55E" : "#2563EB",
        created_at: o.created_at as string,
      });
    }
    for (const c of customers ?? []) {
      rows.push({
        id: `customer:${c.id}`,
        kind: "customer",
        title: `New customer · ${(c.name as string) || (c.email as string) || "Unknown"}`,
        description: (c.email as string) || undefined,
        href: "/admin/customers",
        tone: "#8B5CF6",
        created_at: c.created_at as string,
      });
    }
    for (const p of products ?? []) {
      const stock = (p.stock as number) ?? 0;
      rows.push({
        id: `stock:${p.id}`,
        kind: stock === 0 ? "out_of_stock" : "low_stock",
        title: stock === 0 ? `Out of stock · ${p.title}` : `Low stock · ${p.title}`,
        description: `${stock} left in inventory`,
        href: "/admin/products",
        tone: stock === 0 ? "#EF4444" : "#F59E0B",
        created_at: (p.updated_at as string) || new Date().toISOString(),
      });
    }

    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return rows.slice(0, 25);
  });
