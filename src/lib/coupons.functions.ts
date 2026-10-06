// Server functions for coupon CRUD and public validation.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().trim().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("coupons")
      .select("code, discount_type, discount_value, active, expiry_date, usage_limit, usage_count")
      .ilike("code", data.code)
      .eq("active", true)
      .maybeSingle();
    if (error || !row) return { ok: false as const, error: "Enter a valid discount code" };
    if (row.expiry_date && new Date(row.expiry_date as string) <= new Date()) {
      return { ok: false as const, error: "Enter a valid discount code" };
    }
    if (row.usage_limit != null && (row.usage_count ?? 0) >= row.usage_limit) {
      return { ok: false as const, error: "Enter a valid discount code" };
    }
    return {
      ok: true as const,
      coupon: {
        code: row.code as string,
        discount_type: row.discount_type as string,
        discount_value: row.discount_value as number,
      },
    };
  });

const couponInput = z.object({
  code: z.string().trim().min(1).max(64),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().int().min(0).max(100000),
  expiry_date: z.string().nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
});

async function assertAdmin(userId: string) {
  await (await import("@/lib/admin-guard.server")).requireAdminAccess(userId);
}

export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await context.supabase
      .from("coupons").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => couponInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await context.supabase
      .from("coupons").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), patch: couponInput.partial() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await context.supabase
      .from("coupons").update(data.patch).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await context.supabase.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
