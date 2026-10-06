import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Mail, MessageSquare, MoreHorizontal, Search, Ban } from "lucide-react";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { adminListCustomersRich, adminSetEmailBan } from "@/lib/admin.functions";

export const Route = createFileRoute("/7c65c08c3d6f419c284e9e40/customers")({ component: Customers });

const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const timeAgo = (iso: string | null) => {
  if (!iso) return "—";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
};

const initialsOf = (email: string, name: string | null) => {
  if (name) return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return email.slice(0, 2).toUpperCase();
};

const palette = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#8b5cf6", "#0ea5e9"];
const colorFor = (s: string) => palette[Math.abs(s.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % palette.length];

function Customers() {
  const listFn = useServerFn(adminListCustomersRich);
  const banFn = useServerFn(adminSetEmailBan);
  const [banEmail, setBanEmail] = useState("");
  const setBan = async (email: string, banned: boolean) => {
    if (banned && !confirm(`Permanently ban ${email}? They won't be able to sign in or get codes.`)) return;
    try { await banFn({ data: { email, banned } }); await refetch(); toast.success(banned ? `Banned ${email}` : `Unbanned ${email}`); }
    catch (e) { toast.error((e as Error).message); }
  };
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((c) => !q || c.email.toLowerCase().includes(q) || (c.name || "").toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Every account and shopper on TRXSHOP. Ban an email to silently block sign-in and codes."
        actions={
          <span className="text-[11.5px] text-[#71717A]">{rows.length} total</span>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex h-8 w-full max-w-xs items-center gap-2 rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5">
            <Search className="h-3.5 w-3.5 text-[#71717A]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers" className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-[#52525B]" />
          </div>
          <input value={banEmail} onChange={(e) => setBanEmail(e.target.value.trim())} placeholder="Ban any email…" className="ml-auto h-8 w-48 rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 text-[12px] text-white outline-none placeholder:text-[#52525B]" />
          <button disabled={!banEmail.includes("@")} onClick={() => { void setBan(banEmail, true); setBanEmail(""); }} className="h-8 rounded-md bg-[#EF4444]/15 px-3 text-[12px] text-[#f87171] hover:bg-[#EF4444]/25 disabled:opacity-40">Ban</button>
          <span className="text-[11.5px] text-[#71717A]">{list.length} of {rows.length}</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {isLoading && (
            <div className="px-5 py-12 text-center"><Loader size={40} className="mx-auto" /></div>
          )}
          {!isLoading && list.length === 0 && (
            <div className="px-5 py-12 text-center text-[12.5px] text-[#71717A]">No customers yet.</div>
          )}
          {list.map((c, i) => {
            const tier = c.ltv > 5000 ? "vip" : c.orders > 1 ? "regular" : "new";
            return (
              <motion.div
                key={c.email}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * i }}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: `linear-gradient(135deg, ${colorFor(c.email)}, #18181B)` }}>
                  {initialsOf(c.email, c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] text-white">{c.name || c.email}</span>
                    <Badge tone={tier === "vip" ? "info" : tier === "new" ? "warning" : "neutral"}>{tier}</Badge>
                    {c.banned && <Badge tone="danger">banned</Badge>}
                  </div>
                  <div className="truncate text-[11.5px] text-[#71717A]">{c.email}</div>
                </div>
                <div className="hidden flex-col items-end leading-tight sm:flex">
                  <span className="text-[12px] tabular-nums text-white">{inr(c.ltv)}</span>
                  <span className="text-[11px] text-[#71717A]">Lifetime value</span>
                </div>
                <div className="hidden flex-col items-end leading-tight md:flex">
                  <span className="text-[12px] tabular-nums text-white">{c.orders}</span>
                  <span className="text-[11px] text-[#71717A]">Orders</span>
                </div>
                <div className="hidden flex-col items-end leading-tight lg:flex">
                  <span className="text-[12px] text-white">{timeAgo(c.last)}</span>
                  <span className="text-[11px] text-[#71717A]">Last order</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setBan(c.email, !c.banned)} title={c.banned ? "Unban" : "Ban permanently"} className={`grid h-7 w-7 place-items-center rounded-md hover:bg-white/[0.04] ${c.banned ? "text-[#f87171]" : "text-[#A1A1AA] hover:text-[#f87171]"}`} aria-label={c.banned ? "Unban" : "Ban"}><Ban className="h-3.5 w-3.5" /></button>
                  <a href={`mailto:${c.email}`} className="grid h-7 w-7 place-items-center rounded-md text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white" aria-label="Email"><Mail className="h-3.5 w-3.5" /></a>
                  <button onClick={() => toast(`Open conversation with ${c.email}`)} className="grid h-7 w-7 place-items-center rounded-md text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white" aria-label="Message"><MessageSquare className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { navigator.clipboard?.writeText(c.email); toast(`Copied ${c.email}`); }} className="grid h-7 w-7 place-items-center rounded-md text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white" aria-label="Copy"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
