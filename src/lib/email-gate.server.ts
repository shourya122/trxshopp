// Server-only: silently block auth emails to banned addresses and throttle OTP spam.
const WINDOW_MIN = 15;
const MAX_PER_WINDOW = 4;
const MAX_PER_DAY = 15;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function isEmailBanned(email: string) {
  const sb = await admin();
  const { data } = await sb.from("banned_emails").select("email").eq("email", email.trim().toLowerCase()).maybeSingle();
  return !!data;
}

/** Returns true when the auth email may be sent (and records the attempt). */
export async function allowAuthEmail(email: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (!e) return true;
  if (await isEmailBanned(e)) return false;
  const sb = await admin();
  const since = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  const [{ count: recent }, { count: day }] = await Promise.all([
    sb.from("auth_email_attempts").select("id", { count: "exact", head: true }).eq("email", e).gte("created_at", since(WINDOW_MIN)),
    sb.from("auth_email_attempts").select("id", { count: "exact", head: true }).eq("email", e).gte("created_at", since(1440)),
  ]);
  if ((recent ?? 0) >= MAX_PER_WINDOW || (day ?? 0) >= MAX_PER_DAY) return false;
  await sb.from("auth_email_attempts").insert({ email: e });
  return true;
}

export function findEmail(obj: unknown, depth = 0): string | null {
  if (!obj || typeof obj !== "object" || depth > 4) return null;
  const o = obj as Record<string, unknown>;
  for (const k of ["email", "recipient"]) {
    if (typeof o[k] === "string" && (o[k] as string).includes("@")) return o[k] as string;
  }
  for (const v of Object.values(o)) {
    const f = findEmail(v, depth + 1);
    if (f) return f;
  }
  return null;
}
