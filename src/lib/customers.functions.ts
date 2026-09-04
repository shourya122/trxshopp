// Server functions for customer profile + admin listing.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: customer } = await context.supabase
      .from("customers").select("*").eq("id", context.userId).maybeSingle();
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    return {
      customer,
      roles: (roles ?? []).map((r) => r.role as string),
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await context.supabase
      .from("customers")
      .select("id, email, name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
