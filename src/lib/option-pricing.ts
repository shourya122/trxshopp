// Shared, pure helpers for validating client-selected variant options against
// the product's stored option_groups and resolving any price override.
// Used by server code — never trust the client's price.

export type RawOptionGroups = unknown;

export interface OptionResolution {
  ok: boolean;
  error?: string;
  /** Absolute unit price override in cents, if any selected value defines one. */
  priceCents: number | null;
  /** Display suffix e.g. " (Plan: 1 Year)" */
  suffix: string;
  /** Normalised selections that matched the product definition. */
  selected: Record<string, string>;
}

function normaliseGroups(raw: RawOptionGroups): { name: string; values: { value: string; priceCents: number | null }[] }[] {
  if (!Array.isArray(raw)) return [];
  const out: { name: string; values: { value: string; priceCents: number | null }[] }[] = [];
  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const rec = g as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    if (!name) continue;
    const values: { value: string; priceCents: number | null }[] = [];
    if (Array.isArray(rec.values)) {
      for (const v of rec.values) {
        if (typeof v === "string") {
          if (v.trim()) values.push({ value: v.trim(), priceCents: null });
          continue;
        }
        if (!v || typeof v !== "object") continue;
        const vr = v as Record<string, unknown>;
        const label = typeof vr.value === "string" ? vr.value.trim() : "";
        if (!label) continue;
        const cents = Number(vr.price_cents ?? vr.priceCents);
        values.push({ value: label, priceCents: Number.isFinite(cents) && cents > 0 ? Math.round(cents) : null });
      }
    }
    if (values.length) out.push({ name, values });
  }
  return out;
}

export function resolveOptions(
  rawGroups: RawOptionGroups,
  options: Record<string, string> | undefined,
): OptionResolution {
  const groups = normaliseGroups(rawGroups);
  const selected: Record<string, string> = {};
  let priceCents: number | null = null;

  if (options) {
    for (const [key, value] of Object.entries(options)) {
      const group = groups.find((g) => g.name === key);
      if (!group) return { ok: false, error: `Unknown option: ${key}`, priceCents: null, suffix: "", selected: {} };
      const match = group.values.find((v) => v.value === value);
      if (!match) return { ok: false, error: `Unknown option value: ${value}`, priceCents: null, suffix: "", selected: {} };
      selected[key] = match.value;
      if (match.priceCents != null) priceCents = match.priceCents;
    }
  }

  const keys = Object.keys(selected);
  const suffix = keys.length
    ? ` (${keys.map((k) => `${k}: ${selected[k]}`).join(", ")})`
    : "";
  return { ok: true, priceCents, suffix, selected };
}
