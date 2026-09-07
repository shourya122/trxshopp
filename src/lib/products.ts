// Supabase-backed product catalog.
import { supabase } from "@/integrations/supabase/client";
import type { Product, Platform } from "./types";

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  old_price_cents: number;
  cover_image: string | null;
  screenshots: string[] | null;
  platforms: string[] | null;
  genre: string | null;
  developer: string | null;
  publisher: string | null;
  release_date: string | null;
  languages: string | null;
  badge: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
  rating: number | string;
  editions: unknown;
  editions_label?: unknown;
  option_groups?: unknown;

  created_at: string;
  updated_at: string;
};

function parseEditions(raw: unknown): { name: string; priceCents: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { name: string; priceCents: number }[] = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const rec = e as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    const priceCents = Number(rec.price_cents ?? rec.priceCents);
    if (!name || !Number.isFinite(priceCents) || priceCents < 0) continue;
    out.push({ name, priceCents: Math.round(priceCents) });
  }
  return out;
}

function parseOptionGroups(raw: unknown): { name: string; values: { value: string; priceCents?: number | null }[] }[] {
  if (!Array.isArray(raw)) return [];
  const out: { name: string; values: { value: string; priceCents?: number | null }[] }[] = [];
  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const rec = g as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    const values: { value: string; priceCents?: number | null }[] = [];
    if (Array.isArray(rec.values)) {
      for (const v of rec.values) {
        if (typeof v === "string") {
          if (v.trim()) values.push({ value: v.trim(), priceCents: null });
          continue;
        }
        if (!v || typeof v !== "object") continue;
        const vr = v as Record<string, unknown>;
        const label = typeof vr.value === "string" ? vr.value.trim() : typeof vr.name === "string" ? (vr.name as string).trim() : "";
        if (!label) continue;
        const cents = Number(vr.price_cents ?? vr.priceCents);
        values.push({ value: label, priceCents: Number.isFinite(cents) && cents > 0 ? Math.round(cents) : null });
      }
    }
    if (!name || values.length === 0) continue;
    out.push({ name, values });
  }
  return out;
}



function rowToProduct(r: Row): Product {
  const created = new Date(r.created_at).getTime();
  const updated = new Date(r.updated_at).getTime();
  return {
    id: r.id,
    shopifyHandle: r.slug,
    variantId: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? "",
    genre: r.genre ?? "",
    developer: r.developer ?? "",
    publisher: r.publisher ?? "",
    releaseDate: r.release_date ?? "",
    languages: r.languages ?? "English",
    platforms: ((r.platforms ?? ["pc"]) as Platform[]),
    coverImage: r.cover_image ?? "",
    screenshots: r.screenshots ?? [],
    priceCents: r.price_cents,
    oldPriceCents: r.old_price_cents,
    stock: r.stock,
    active: r.active,
    featured: r.featured,
    badge: (r.badge as Product["badge"]) || "",
    editions: parseEditions(r.editions),
    editionsLabel: typeof r.editions_label === "string" ? r.editions_label : "",
    optionGroups: parseOptionGroups(r.option_groups),

    rating: typeof r.rating === "string" ? parseFloat(r.rating) : r.rating,
    votes: "0",
    createdAt: created,
    updatedAt: updated,
  };
}

export async function listProducts(
  opts: { activeOnly?: boolean; max?: number; query?: string } = {},
): Promise<Product[]> {
  let q = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (opts.activeOnly) q = q.eq("active", true);
  if (opts.max) q = q.limit(opts.max);
  if (opts.query) q = q.ilike("title", `%${opts.query}%`);
  const { data, error } = await q;
  if (error) {
    console.error("[products] list", error);
    return [];
  }
  return (data as Row[]).map(rowToProduct);
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  // Try by uuid first, then by slug
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const q = supabase.from("products").select("*").limit(1);
  const { data, error } = isUuid
    ? await q.eq("id", idOrSlug)
    : await q.eq("slug", idOrSlug);
  if (error || !data || !data.length) return null;
  return rowToProduct(data[0] as Row);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .limit(1);
  if (error || !data || !data.length) return null;
  return rowToProduct(data[0] as Row);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
