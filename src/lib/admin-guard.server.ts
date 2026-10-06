// Server-only admin guard: admin role + IP allowlist + PIN-unlocked session cookie.
import { createHmac, randomBytes, timingSafeEqual, scryptSync } from "crypto";

export const ADMIN_COOKIE = "trx_adm";
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours
const SEC_KEY = "admin_security";

export type AdminSecurity = {
  ips: string[];
  pin_hash: string | null;
  pin_salt: string | null;
  fails: number;
  locked_until: string | null;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function secret() {
  return "trx-admin-v1:" + (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
}

export async function getClientIp(): Promise<string> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const raw =
    getRequestHeader("cf-connecting-ip") ||
    getRequestHeader("x-real-ip") ||
    (getRequestHeader("x-forwarded-for") || "").split(",")[0] ||
    "";
  return raw.trim();
}

export async function loadSecurity(): Promise<AdminSecurity> {
  const sb = await admin();
  const { data } = await sb.from("site_settings").select("value").eq("key", SEC_KEY).maybeSingle();
  const v = (data?.value ?? {}) as Partial<AdminSecurity>;
  return {
    ips: Array.isArray(v.ips) ? v.ips.filter((x) => typeof x === "string") : [],
    pin_hash: v.pin_hash ?? null,
    pin_salt: v.pin_salt ?? null,
    fails: Number(v.fails ?? 0),
    locked_until: v.locked_until ?? null,
  };
}

export async function saveSecurity(s: AdminSecurity) {
  const sb = await admin();
  const { error } = await sb
    .from("site_settings")
    .upsert({ key: SEC_KEY, value: s as unknown as never }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export function hashPin(pin: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString("hex");
  return { salt: s, hash: scryptSync(pin, s, 32).toString("hex") };
}

export function pinMatches(pin: string, sec: AdminSecurity) {
  if (!sec.pin_hash || !sec.pin_salt) return false;
  const a = Buffer.from(hashPin(pin, sec.pin_salt).hash, "hex");
  const b = Buffer.from(sec.pin_hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function issueSession(userId: string, sec: AdminSecurity) {
  const { setCookie } = await import("@tanstack/react-start/server");
  const exp = Date.now() + SESSION_MS;
  // Bind to PIN hash so changing the PIN logs out every session.
  const payload = `${userId}.${exp}`;
  const sig = sign(`${payload}.${sec.pin_hash ?? ""}`);
  setCookie(ADMIN_COOKIE, `${payload}.${sig}`, {
    httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: SESSION_MS / 1000,
  });
}

export async function clearSession() {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie(ADMIN_COOKIE, { path: "/" });
}

async function sessionValid(userId: string, sec: AdminSecurity) {
  const { getCookie } = await import("@tanstack/react-start/server");
  const raw = getCookie(ADMIN_COOKIE);
  if (!raw) return false;
  const [uid, exp, sig] = raw.split(".");
  if (uid !== userId || !exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = sign(`${uid}.${exp}.${sec.pin_hash ?? ""}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hasAdminRole(userId: string) {
  const sb = await admin();
  const { data, error } = await sb
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export function ipAllowed(ip: string, sec: AdminSecurity) {
  return sec.ips.length === 0 || sec.ips.includes(ip);
}

export async function adminStatus(userId: string) {
  const role = await hasAdminRole(userId);
  const sec = await loadSecurity();
  const ip = await getClientIp();
  return {
    role,
    ip,
    sec,
    ipOk: ipAllowed(ip, sec),
    pinSet: !!sec.pin_hash,
    unlocked: role && !!sec.pin_hash && (await sessionValid(userId, sec)),
  };
}

/** Throws unless caller is admin, on an allowed IP, and has unlocked with the PIN. */
export async function requireAdminAccess(userId: string) {
  const s = await adminStatus(userId);
  if (!s.role) throw new Error("Forbidden");
  if (!s.ipOk) throw new Error("Forbidden: this network is not allowed");
  if (!s.unlocked) throw new Error("Admin locked: enter your PIN");
  return await admin();
}
