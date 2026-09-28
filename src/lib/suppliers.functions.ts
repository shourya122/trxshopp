// Admin-only supplier management: suppliers, the variants they supply, and restock history.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
  return supabaseAdmin;
}

export type Supplier = {
  id: string; name: string; contact_email: string; contact_discord: string;
  phone: string; notes: string; active: boolean; created_at: string;
};
export type SupplierItem = { id: string; supplier_id: string; product_id: string; edition_name: string; cost_cents: number };
export type Restock = {
  id: string; supplier_id: string | null; product_id: string | null; edition_name: string;
  quantity: number; cost_cents: number; notes: string; restocked_at: string;
};
export type InvProduct = {
  id: string; title: string; stock: number;
  editions: { name: string; stock: number | null; out_of_stock: boolean }[];
};

export const adminSupplierData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context.userId);
    const [s, i, r, p] = await Promise.all([
      db.from("suppliers").select("*").order("name"),
      db.from("supplier_items").select("id, supplier_id, product_id, edition_name, cost_cents"),
      db.from("supplier_restocks").select("*").order("restocked_at", { ascending: false }).limit(1000),
      db.from("products").select("id, title, stock, editions").order("title"),
    ]);
    for (const x of [s, i, r, p]) if (x.error) throw new Error(x.error.message);
    const products: InvProduct[] = (p.data ?? []).map((row) => ({
      id: row.id, title: row.title, stock: row.stock,
      editions: (Array.isArray(row.editions) ? row.editions : []).map((e) => {
        const rec = (e ?? {}) as Record<string, unknown>;
        const st = rec.stock === null || rec.stock === undefined || rec.stock === "" ? null : Number(rec.stock);
        return { name: String(rec.name ?? ""), stock: Number.isFinite(st as number) ? (st as number) : null, out_of_stock: rec.out_of_stock === true };
      }).filter((e) => e.name),
    }));
    return {
      suppliers: (s.data ?? []) as Supplier[],
      items: (i.data ?? []) as SupplierItem[],
      restocks: (r.data ?? []) as Restock[],
      products,
    };
  });

const supplierInput = z.object({
  name: z.string().trim().min(1).max(120),
  contact_email: z.string().trim().max(200).default(""),
  contact_discord: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(40).default(""),
  notes: z.string().trim().max(2000).default(""),
  active: z.boolean().default(true),
});

export const adminSaveSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid().nullable(), values: supplierInput }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context.userId);
    const q = data.id
      ? db.from("suppliers").update(data.values).eq("id", data.id)
      : db.from("suppliers").insert(data.values);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context.userId);
    const { error } = await db.from("suppliers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminLinkSupplierItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    supplier_id: z.string().uuid(), product_id: z.string().uuid(),
    edition_name: z.string().max(200).default(""), cost_cents: z.number().int().min(0).max(1e9).default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context.userId);
    const { error } = await db.from("supplier_items").upsert(data, { onConflict: "supplier_id,product_id,edition_name" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUnlinkSupplierItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context.userId);
    const { error } = await db.from("supplier_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Logs a restock and adds the quantity to the variant's (or product's) live stock.
export const adminLogRestock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    supplier_id: z.string().uuid().nullable(), product_id: z.string().uuid(),
    edition_name: z.string().max(200).default(""), quantity: z.number().int().min(1).max(1000000),
    cost_cents: z.number().int().min(0).max(1e9).default(0), notes: z.string().max(1000).default(""),
    restocked_at: z.string().datetime().optional(), update_stock: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context.userId);
    const { update_stock, ...row } = data;
    if (update_stock) {
      const { data: p, error } = await db.from("products").select("stock, editions").eq("id", data.product_id).single();
      if (error || !p) throw new Error("Product not found");
      if (data.edition_name) {
        const eds = Array.isArray(p.editions) ? (p.editions as Record<string, unknown>[]) : [];
        let found = false;
        const next = eds.map((e) => {
          if (e?.name !== data.edition_name) return e;
          found = true;
          const cur = Number(e.stock);
          return { ...e, stock: (Number.isFinite(cur) ? cur : 0) + data.quantity, out_of_stock: false };
        });
        if (!found) throw new Error("Variant not found on this product");
        const { error: ue } = await db.from("products").update({ editions: next as never }).eq("id", data.product_id);
        if (ue) throw new Error(ue.message);
      } else {
        const { error: ue } = await db.from("products").update({ stock: (p.stock ?? 0) + data.quantity }).eq("id", data.product_id);
        if (ue) throw new Error(ue.message);
      }
    }
    const { error } = await db.from("supplier_restocks").insert({ ...row, restocked_at: row.restocked_at ?? new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteRestock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context.userId);
    const { error } = await db.from("supplier_restocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
