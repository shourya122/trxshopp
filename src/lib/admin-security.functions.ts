import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const pinSchema = z.string().regex(/^\d{6,12}$/, "PIN must be 6-12 digits");

export const adminSecurityStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const g = await import("@/lib/admin-guard.server");
    const s = await g.adminStatus(context.userId);
    if (!s.role) return { role: false as const };
    return {
      role: true as const,
      ip: s.ip,
      ipOk: s.ipOk,
      pinSet: s.pinSet,
      unlocked: s.unlocked,
      lockedUntil: s.sec.locked_until,
    };
  });

export const adminSetupPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ pin: pinSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const g = await import("@/lib/admin-guard.server");
    const s = await g.adminStatus(context.userId);
    if (!s.role || !s.ipOk) throw new Error("Forbidden");
    if (s.pinSet) throw new Error("PIN already set");
    const { salt, hash } = g.hashPin(data.pin);
    const sec = { ...s.sec, pin_hash: hash, pin_salt: salt, fails: 0, locked_until: null };
    await g.saveSecurity(sec);
    await g.issueSession(context.userId, sec);
    return { ok: true };
  });

export const adminUnlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ pin: z.string().max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const g = await import("@/lib/admin-guard.server");
    const s = await g.adminStatus(context.userId);
    if (!s.role || !s.ipOk) throw new Error("Forbidden");
    const sec = s.sec;
    if (sec.locked_until && new Date(sec.locked_until) > new Date()) {
      return { ok: false as const, error: "Too many wrong tries. Try again later." };
    }
    if (!g.pinMatches(data.pin, sec)) {
      const fails = sec.fails + 1;
      const lock = fails >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      await g.saveSecurity({ ...sec, fails: lock ? 0 : fails, locked_until: lock });
      return { ok: false as const, error: lock ? "Too many wrong tries. Locked for 15 minutes." : `Wrong PIN (${5 - fails} tries left)` };
    }
    await g.saveSecurity({ ...sec, fails: 0, locked_until: null });
    await g.issueSession(context.userId, sec);
    return { ok: true as const };
  });

export const adminLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const g = await import("@/lib/admin-guard.server");
    await g.clearSession();
    return { ok: true };
  });

export const adminGetIps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const g = await import("@/lib/admin-guard.server");
    await g.requireAdminAccess(context.userId);
    const sec = await g.loadSecurity();
    return { ips: sec.ips, myIp: await g.getClientIp() };
  });

export const adminSetIps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ips: z.array(z.string().trim().min(3).max(64)).max(30) }).parse(d))
  .handler(async ({ data, context }) => {
    const g = await import("@/lib/admin-guard.server");
    await g.requireAdminAccess(context.userId);
    const sec = await g.loadSecurity();
    const myIp = await g.getClientIp();
    const ips = Array.from(new Set(data.ips));
    if (ips.length && !ips.includes(myIp)) throw new Error("Your current IP must be in the list, or you'd lock yourself out.");
    await g.saveSecurity({ ...sec, ips });
    return { ok: true };
  });

export const adminChangePin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ current: z.string().max(20), pin: pinSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const g = await import("@/lib/admin-guard.server");
    await g.requireAdminAccess(context.userId);
    const sec = await g.loadSecurity();
    if (!g.pinMatches(data.current, sec)) throw new Error("Current PIN is wrong");
    const { salt, hash } = g.hashPin(data.pin);
    const next = { ...sec, pin_hash: hash, pin_salt: salt };
    await g.saveSecurity(next);
    await g.issueSession(context.userId, next);
    return { ok: true };
  });
