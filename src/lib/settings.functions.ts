import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const DEFAULT_USD_INR_RATE = 104;

/** Public, unauthenticated read of storefront settings (currently the USD rate). */
export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data } = await client.from("site_settings").select("key, value").eq("key", "usd_inr_rate").maybeSingle();

  const raw = data?.value as unknown;
  const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  const usdInrRate = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_USD_INR_RATE;

  return { usdInrRate };
});

/** Visitor country from the edge (Cloudflare) request headers. */
export const getVisitorCountry = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const raw =
    getRequestHeader("cf-ipcountry") ||
    getRequestHeader("x-vercel-ip-country") ||
    getRequestHeader("x-country-code") ||
    "";
  const country = raw.trim().toUpperCase();
  return { country: /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : null };
});

/** Admin-only write of the USD rate. */
export const adminUpdateUsdRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rate: number }) => {
    const rate = Number(input?.rate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100000) throw new Error("Enter a valid rate greater than 0");
    return { rate: Math.round(rate * 100) / 100 };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "usd_inr_rate", value: data.rate as unknown as never }, { onConflict: "key" });
    if (error) throw new Error(error.message);

    return { ok: true, rate: data.rate };
  });
