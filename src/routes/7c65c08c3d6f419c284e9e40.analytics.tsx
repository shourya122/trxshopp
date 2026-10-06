import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Card, PageHeader, Stat } from "@/components/admin/ui";
import { adminAnalyticsTrend, adminDashboardStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/7c65c08c3d6f419c284e9e40/analytics")({ component: Analytics });

const axis = { stroke: "#52525B", tick: { fontSize: 11 } };
const tooltip = {
  contentStyle: { background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#A1A1AA" },
};
const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function Analytics() {
  const trendFn = useServerFn(adminAnalyticsTrend);
  const statsFn = useServerFn(adminDashboardStats);
  const { data: trend = [], isLoading: tLoad } = useQuery({ queryKey: ["admin-analytics-trend"], queryFn: () => trendFn() });
  const { data: stats, isLoading: sLoad } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => statsFn() });

  const totals = useMemo(() => {
    const rev = trend.reduce((s, d) => s + d.rev, 0);
    const ord = trend.reduce((s, d) => s + d.orders, 0);
    const paidRev = stats?.totalRevenue ?? 0;
    const avg = ord ? paidRev / (stats?.paidCount || 1) : 0;
    return { rev, ord, avg, paidCount: stats?.paidCount ?? 0 };
  }, [trend, stats]);

  const topProducts = stats?.topProducts ?? [];

  return (
    <div>
      <PageHeader title="Analytics" description="Real revenue and traffic derived from your live orders." />

      {(tLoad || sLoad) && (
        <div className="mb-3 flex items-center gap-2 text-[12px] text-[#A1A1AA]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading real data…</div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue (30d)" value={inr(totals.rev)} delta="" trend="up" spark={trend.map((d) => d.rev)} index={0} />
        <Stat label="Orders (30d)" value={totals.ord.toLocaleString()} delta={`${totals.paidCount} paid`} trend="up" spark={trend.map((d) => d.orders)} index={1} />
        <Stat label="Avg paid order" value={inr(Math.round(totals.avg))} delta="" trend="up" spark={trend.map((d) => d.rev)} index={2} />
        <Stat label="Conversion" value={`${(stats?.conversion ?? 0).toFixed(1)}%`} delta="paid / placed" trend="up" spark={[]} index={3} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-[13.5px] font-semibold text-white">Revenue trend</h3>
            <p className="text-[11.5px] text-[#A1A1AA]">Daily paid revenue, last 30 days</p>
          </div>
          <div className="h-[280px] p-3">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="d" {...axis} axisLine={false} tickLine={false} />
                <YAxis {...axis} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + "k" : v}`} />
                <Tooltip {...tooltip} formatter={(v: number) => inr(v)} />
                <Line type="monotone" dataKey="rev" stroke="#2563EB" strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-[13.5px] font-semibold text-white">Top products</h3>
            <p className="text-[11.5px] text-[#A1A1AA]">By units sold</p>
          </div>
          <div className="h-[280px] p-3">
            {topProducts.length === 0 ? (
              <div className="grid h-full place-items-center text-[12px] text-[#71717A]">No product sales yet.</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={topProducts.map((p) => ({ src: p.name.slice(0, 12), v: p.sold }))} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="src" {...axis} axisLine={false} tickLine={false} />
                  <YAxis {...axis} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltip} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="v" fill="#2563EB" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
