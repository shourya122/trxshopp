import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const DEFAULT_USD_INR_RATE = 88;

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

/** Admin-only write of the USD rate. */
export const adminUpdateUsdRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rate: number }) => {
    const rate = Number(input?.rate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100000) throw new Error("Enter a valid rate greater than 0");
    return { rate: Math.round(rate * 100) / 100 };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "usd_inr_rate", value: data.rate as unknown as never }, { onConflict: "key" });
    if (error) throw new Error(error.message);

    return { ok: true, rate: data.rate };
  });
