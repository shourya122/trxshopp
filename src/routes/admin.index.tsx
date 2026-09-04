import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ArrowUpRight, MoreHorizontal, Loader2 } from "lucide-react";
import { Card, PageHeader, Stat, Badge } from "@/components/admin/ui";
import { adminDashboardStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); return `${d}d`;
};

function Dashboard() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(adminDashboardStats);
  const [period, setPeriod] = useState("7D");
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchStats(),
    refetchOnWindowFocus: false,
  });

  const stats = data;
  const series = stats?.revenueSeries ?? [];
  const maxSold = Math.max(1, ...(stats?.topProducts ?? []).map((p) => p.sold));

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A real-time snapshot of TRXSHOP's performance."
        actions={
          <>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 rounded-md border border-white/[0.06] bg-[#111113] px-3 text-[12px] text-[#A1A1AA] hover:text-white disabled:opacity-50"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
            <button
              onClick={() => toast.success("Export queued")}
              className="flex h-8 items-center gap-1.5 rounded-md border border-white/[0.06] bg-[#111113] px-3 text-[12px] text-white transition hover:border-white/10"
            >
              Export <ArrowUpRight className="h-3 w-3" />
            </button>
          </>
        }
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-[12px] text-[#A1A1AA]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading real data…
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue (paid)" value={inr(stats?.totalRevenue ?? 0)} delta="" trend="up" spark={series.map((s) => s.v || 0)} index={0} />
        <Stat label="Orders" value={(stats?.ordersCount ?? 0).toLocaleString()} delta={`${stats?.paidCount ?? 0} paid`} trend="up" spark={series.map((s) => s.v || 0)} index={1} />
        <Stat label="Customers" value={(stats?.customersCount ?? 0).toLocaleString()} delta="" trend="up" spark={[]} index={2} />
        <Stat label="Products" value={(stats?.productsCount ?? 0).toLocaleString()} delta={`${(stats?.conversion ?? 0).toFixed(1)}% paid`} trend="up" spark={[]} index={3} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h3 className="text-[13.5px] font-semibold text-white">Revenue (7 days)</h3>
              <p className="text-[11.5px] text-[#A1A1AA]">Paid orders across all channels</p>
            </div>
            <div className="flex gap-1">
              {["7D", "30D"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-2 py-1 text-[11px] transition ${
                    period === p ? "bg-white/[0.06] text-white" : "text-[#A1A1AA] hover:text-white"
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>
          <div className="h-[260px] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="d" stroke="#52525B" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#52525B" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + "k" : v}`} />
                <Tooltip contentStyle={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#A1A1AA" }} formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={1.8} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-[13.5px] font-semibold text-white">Recent activity</h3>
            <p className="text-[11.5px] text-[#A1A1AA]">Latest orders on your storefront</p>
          </div>
          <ul className="px-5 py-2">
            {(stats?.recent ?? []).length === 0 && !isLoading && (
              <li className="py-6 text-center text-[12px] text-[#71717A]">No orders yet.</li>
            )}
            {(stats?.recent ?? []).map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 py-2.5"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.paid ? "#22C55E" : "#F59E0B" }} />
                <p className="flex-1 text-[12.5px] leading-snug text-[#D4D4D8]">
                  {r.paid ? "Paid" : "Pending"} · {inr(r.rev)} · {r.first}
                  {r.email ? <span className="block text-[11px] text-[#71717A]">{r.email}</span> : null}
                </p>
                <span className="text-[11px] tabular-nums text-[#71717A]">{timeAgo(r.created_at)}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h3 className="text-[13.5px] font-semibold text-white">Recent orders</h3>
              <p className="text-[11.5px] text-[#A1A1AA]">Latest transactions</p>
            </div>
            <button onClick={() => navigate({ to: "/admin/orders" as never })} className="text-[12px] text-[#A1A1AA] transition hover:text-white">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-[#52525B]">
                  <th className="px-5 py-2.5 font-medium">Customer</th>
                  <th className="px-3 py-2.5 font-medium">Product</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent ?? []).map((o, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.03 * i }}
                    onClick={() => navigate({ to: "/admin/orders" as never })}
                    className="cursor-pointer border-b border-white/[0.04] text-[12.5px] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 text-white">{o.email || <span className="text-[#71717A]">guest</span>}</td>
                    <td className="px-3 py-3 text-[#D4D4D8]">{o.first}</td>
                    <td className="px-3 py-3 tabular-nums text-white">{inr(o.rev)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={o.paid ? "success" : "warning"}>{o.paid ? "paid" : "pending"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[#A1A1AA]">{timeAgo(o.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h3 className="text-[13.5px] font-semibold text-white">Top products</h3>
              <p className="text-[11.5px] text-[#A1A1AA]">By units sold</p>
            </div>
            <button onClick={() => navigate({ to: "/admin/products" as never })} className="grid h-7 w-7 place-items-center rounded-md text-[#A1A1AA] hover:text-white" aria-label="View products">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="px-5 py-2">
            {(stats?.topProducts ?? []).length === 0 && !isLoading && (
              <li className="py-6 text-center text-[12px] text-[#71717A]">No sales yet.</li>
            )}
            {(stats?.topProducts ?? []).map((p, i) => {
              const pct = (p.sold / maxSold) * 100;
              return (
                <li key={p.name} className="rounded-md py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12.5px] text-white">{p.name}</span>
                    <span className="text-[11.5px] tabular-nums text-[#A1A1AA]">{inr(p.revenue)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-[#2563EB]" />
                    </div>
                    <span className="w-12 text-right text-[11px] tabular-nums text-[#71717A]">{p.sold}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
