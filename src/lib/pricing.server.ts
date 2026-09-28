// Server-side pricing resolution. NEVER trust client-supplied prices or amounts.
// Fetches product prices from the DB, resolves editions, and applies coupons.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveOptions } from "./option-pricing";

export interface PricingItemInput {
  product_id?: string;
  variantId?: string;
  name?: string;
  qty: number;
  edition_name?: string;
  options?: Record<string, string>;
}

export interface ResolvedLineItem {
  product_id: string;
  title: string;
  qty: number;
  price: number; // INR (decimal)
  price_cents: number;
  variantId?: string;
  edition_name: string | null;
  edition_price_cents: number | null;
}

export interface PricingResult {
  ok: true;
  lineItems: ResolvedLineItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  appliedCoupon: string | null;
}

export interface PricingError {
  ok: false;
  error: string;
}

function getAdmin(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function resolvePricing(
  items: PricingItemInput[],
  couponCode?: string,
): Promise<PricingResult | PricingError> {
  if (!items?.length) return { ok: false, error: "Cart is empty." };

  const admin = getAdmin();

  // Only accept UUID product ids for DB lookup
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ids = Array.from(
    new Set(
      items
        .map((i) => (i.product_id || i.variantId || "").trim())
        .filter((id) => uuidRe.test(id)),
    ),
  );

  if (!ids.length) {
    return { ok: false, error: "No valid products in cart." };
  }

  const { data: products, error: pErr } = await admin
    .from("products")
    .select("id, title, price_cents, active, editions, option_groups")
    .in("id", ids);
  if (pErr) return { ok: false, error: pErr.message };
  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));

  const lineItems: ResolvedLineItem[] = [];
  let subtotalCents = 0;

  for (const it of items) {
    const pid = (it.product_id || it.variantId || "").trim();
    const p = uuidRe.test(pid) ? byId.get(pid) : null;
    if (!p || !p.active) {
      return { ok: false, error: `Product unavailable: ${it.name ?? pid}` };
    }
    const qty = Math.max(1, Math.min(99, Math.floor(it.qty)));
    let unitCents = Number(p.price_cents) || 0;
    let editionName: string | null = null;
    if (it.edition_name) {
      const raw = Array.isArray(p.editions)
        ? (p.editions as Array<{ name?: string; price_cents?: number }>)
        : [];
      const match = raw.find((e) => typeof e?.name === "string" && e.name === it.edition_name);
      if (!match) {
        return { ok: false, error: `Edition unavailable: ${it.edition_name}` };
      }
      if ((match as { out_of_stock?: boolean }).out_of_stock === true) {
        return { ok: false, error: `${it.edition_name} is out of stock` };
      }
      unitCents = Number(match.price_cents) || unitCents;
      editionName = match.name as string;
    }
    if (unitCents <= 0) {
      return { ok: false, error: `Price unavailable: ${p.title}` };
    }
    const optRes = resolveOptions((p as { option_groups?: unknown }).option_groups, it.options);
    if (!optRes.ok) return { ok: false, error: optRes.error ?? "Invalid options." };
    if (optRes.priceCents != null) unitCents = optRes.priceCents;
    const optionSuffix = optRes.suffix;
    lineItems.push({
      product_id: p.id as string,
      title: `${p.title as string}${optionSuffix}`,
      qty,
      price: unitCents / 100,
      price_cents: unitCents,
      variantId: it.variantId,
      edition_name: editionName,
      edition_price_cents: editionName ? unitCents : null,
    });
    subtotalCents += unitCents * qty;
  }

  let discountCents = 0;
  let appliedCoupon: string | null = null;
  const code = couponCode?.trim();
  if (code) {
    const { data: cRow } = await admin
      .from("coupons")
      .select("code, discount_type, discount_value, active, expiry_date, usage_limit, usage_count")
      .ilike("code", code)
      .eq("active", true)
      .maybeSingle();
    const valid = cRow
      && (!cRow.expiry_date || new Date(cRow.expiry_date as string) > new Date())
      && (cRow.usage_limit == null || (cRow.usage_count ?? 0) < cRow.usage_limit);
    if (valid && cRow) {
      appliedCoupon = cRow.code as string;
      if (cRow.discount_type === "percent") {
        discountCents = Math.min(
          subtotalCents,
          Math.floor((subtotalCents * (cRow.discount_value as number)) / 100),
        );
      } else {
        discountCents = Math.min(subtotalCents, (cRow.discount_value as number) * 100);
      }
    }
  }

  const totalCents = Math.max(0, subtotalCents - discountCents);
  return { ok: true, lineItems, subtotalCents, discountCents, totalCents, appliedCoupon };
}
