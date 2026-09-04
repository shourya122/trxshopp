import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";
import { toastPromise } from "@/lib/toast-utils";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { listCoupons, createCoupon, deleteCoupon } from "@/lib/coupons.functions";

export const Route = createFileRoute("/admin/coupons")({ component: Coupons });

const dt = (s: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Never");

function Coupons() {
  const listFn = useServerFn(listCoupons);
  const createFn = useServerFn(createCoupon);
  const deleteFn = useServerFn(deleteCoupon);
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });

  const create = async () => {
    const code = window.prompt("Coupon code?")?.trim().toUpperCase();
    if (!code) return;
    const type = window.prompt("Discount type? percent or fixed", "percent") as "percent" | "fixed";
    if (type !== "percent" && type !== "fixed") return toast.error("Invalid type");
    const value = Number(window.prompt(`Discount value (${type === "percent" ? "%" : "₹"})?`, "10"));
    if (!Number.isFinite(value) || value <= 0) return toast.error("Invalid value");
    toastPromise(
      createFn({ data: { code, discount_type: type, discount_value: Math.round(value), active: true } })
        .then(() => qc.invalidateQueries({ queryKey: ["admin-coupons"] })),
      {
        loading: `Creating ${code}…`,
        success: `Coupon ${code} created`,
        error: (e) => (e as Error).message,
      },
    );
  };

  const remove = async (id: string, code: string) => {
    if (!confirm(`Delete coupon ${code}?`)) return;
    toastPromise(
      deleteFn({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["admin-coupons"] })),
      {
        loading: `Removing ${code}…`,
        success: `Removed ${code}`,
        error: (e) => (e as Error).message,
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes and promotional campaigns."
        actions={
          <button onClick={create} className="h-8 rounded-md bg-[#2563EB] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]">
            Create coupon
          </button>
        }
      />
      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-[#52525B]">
              <th className="px-5 py-2.5 font-medium">Code</th>
              <th className="px-3 py-2.5 font-medium">Discount</th>
              <th className="px-3 py-2.5 font-medium">Redemptions</th>
              <th className="px-3 py-2.5 font-medium">Expires</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-5 py-12 text-center"><Loader size={40} className="mx-auto" /></td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-[12.5px] text-[#71717A]">No coupons yet. Create your first one.</td></tr>
            )}
            {rows.map((c) => {
              const active = c.active as boolean;
              const expired = c.expiry_date && new Date(c.expiry_date as string) <= new Date();
              const state = expired ? "expired" : active ? "active" : "paused";
              return (
                <tr key={c.id as string} className="border-b border-white/[0.04] text-[12.5px] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-mono text-white">
                    <button onClick={() => { navigator.clipboard?.writeText(c.code as string); toast(`Copied ${c.code}`); }} className="hover:underline">
                      {c.code as string}
                    </button>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-white">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : `₹${c.discount_value}`}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-[#A1A1AA]">
                    {(c.usage_count ?? 0)}{c.usage_limit ? ` / ${c.usage_limit}` : " / ∞"}
                  </td>
                  <td className="px-3 py-3 text-[#A1A1AA]">{dt(c.expiry_date as string | null)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={state === "active" ? "success" : state === "expired" ? "neutral" : "warning"}>{state}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => remove(c.id as string, c.code as string)} className="rounded-md px-2 py-1 text-[11.5px] text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#f87171]">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
