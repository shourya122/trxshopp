// Best-effort buyer identity from the incoming Authorization bearer token.
// Used by checkout order creation so paid orders are linked to the
// signed-in customer's account (and appear on their account page).
import { getRequestHeader } from "@tanstack/react-start/server";

export async function resolveBuyerFromRequest(): Promise<{
  userId: string | null;
  email: string | null;
}> {
  try {
    const auth = getRequestHeader("authorization");
    const token = auth?.replace(/^Bearer\s+/i, "");
    if (!token) return { userId: null, email: null };
    const { createClient } = await import("@supabase/supabase-js");
    const userClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: u } = await userClient.auth.getUser(token);
    return { userId: u.user?.id ?? null, email: u.user?.email ?? null };
  } catch {
    return { userId: null, email: null };
  }
}
