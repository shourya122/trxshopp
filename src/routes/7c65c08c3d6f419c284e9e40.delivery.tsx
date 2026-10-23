// Admin delivery tracking: update each order's shipping/delivery status and
// send (or resend) the delivery confirmation email to the customer.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Mail, RefreshCw } from "lucide-react";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { adminListAllOrders, type AdminOrder } from "@/lib/admin.functions";
import { adminUpdateOrder, adminSendDeliveryEmail } from "@/lib/orders.functions";

export const Route = createFileRoute("/7c65c08c3d6f419c284e9e40/delivery")({ component: Delivery });

type FulfillStatus = "unfulfilled" | "in_progress" | "fulfilled" | "on_hold" | "delivered";
const FULFILL_OPTIONS: { value: FulfillStatus; label: string }[] = [
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "in_progress", label: "In progress" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "on_hold", label: "On hold" },
  { value: "delivered", label: "Delivered" },
];

const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dt = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const deliveryTone = (s: string | null) => {
  const v = (s || "unfulfilled").toLowerCase();
  if (v === "delivered" || v === "fulfilled") return "success";
  if (v === "in_progress") return "info";
  if (v === "on_hold") return "warning";
  return "danger";
};

const itemVariantParts = (it: Record<string, unknown>): string[] => {
  const parts: string[] = [];
  const ed = it.edition_name as string | undefined | null;
  if (ed) parts.push(ed);
  const opts = it.options as Record<string, string> | undefined | null;
  if (opts && typeof opts === "object") {
    for (const [k, v] of Object.entries(opts)) parts.push(`${k}: ${v}`);
  }
  return parts;
};

const itemLabel = (it: Record<string, unknown>) => {
  const name = String(it.name || it.title || "Item");
  const variant = itemVariantParts(it);
  const qty = Number(it.qty ?? it.quantity ?? 1);
  return `${name}${variant.length ? ` · ${variant.join(" · ")}` : ""} × ${qty}`;
};

function Delivery() {
  const listFn = useServerFn(adminListAllOrders);
  const updateFn = useServerFn(adminUpdateOrder);
  const emailFn = useServerFn(adminSendDeliveryEmail);
  const qc = useQueryClient();
  const { data: rows = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: true,
    refetchInterval: 20000,
  });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "delivered" | "all">("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [emailBusyId, setEmailBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        const delivered = (r.order_status || "").toLowerCase() === "delivered";
        if (filter === "delivered") return delivered;
        if (filter === "active") return !delivered;
        return true;
      })
      .filter((r) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        (r.customer_email || "").toLowerCase().includes(q) ||
        r.items.map((it) => itemLabel(it as Record<string, unknown>)).join(" ").toLowerCase().includes(q),
      );
  }, [rows, filter, query]);

  const setStatus = async (order: AdminOrder, status: FulfillStatus) => {
    setBusyId(order.id);
    try {
      await updateFn({ data: { id: order.id, order_status: status } });
      toast.success(
        status === "delivered"
          ? "Marked delivered — confirmation email sent"
          : `Order marked ${FULFILL_OPTIONS.find((o) => o.value === status)?.label}`,
      );
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const resendEmail = async (order: AdminOrder) => {
    setEmailBusyId(order.id);
    try {
      const res = await emailFn({ data: { id: order.id } });
      if (res?.ok) toast.success(`Delivery email sent to ${order.customer_email}`);
      else toast.error((res as { error?: string })?.error || "Failed to send email");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEmailBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery"
        description="Update each order's delivery status and notify the customer."
        actions={
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 p-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, email or product…"
              className="w-full rounded-md border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-400/40 focus:outline-none"
            />
          </div>
          <div className="flex gap-1 rounded-md border border-white/10 p-1">
            {(["active", "delivered", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1 text-xs capitalize transition-colors ${
                  filter === f ? "bg-emerald-400/15 text-emerald-300" : "text-white/50 hover:text-white"
                }`}
              >
                {f === "active" ? "To deliver" : f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10"><Loader /></div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-white/40">No orders here.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((o) => {
              const current = ((o.order_status || "unfulfilled").toLowerCase() as FulfillStatus);
              const delivered = current === "delivered";
              return (
                <li key={o.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {o.items[0]?.cover_image ? (
                      <img
                        src={o.items[0].cover_image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded border border-white/10 bg-white/5" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {o.items.map((it) => itemLabel(it as Record<string, unknown>)).join(", ") || "—"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/40">
                        {o.customer_email || "guest"} · {inr(o.amount_inr)} · {dt(o.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:gap-3">
                    <Badge tone={deliveryTone(o.order_status)}>
                      {FULFILL_OPTIONS.find((f) => f.value === current)?.label ?? "Unfulfilled"}
                    </Badge>
                    <select
                      value={current}
                      disabled={busyId === o.id}
                      onChange={(e) => setStatus(o, e.target.value as FulfillStatus)}
                      className="rounded-md border border-white/10 bg-black/60 px-2 py-1.5 text-xs text-white focus:border-emerald-400/40 focus:outline-none disabled:opacity-50"
                    >
                      {FULFILL_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => resendEmail(o)}
                      disabled={emailBusyId === o.id || !o.customer_email}
                      title={o.customer_email ? `Email delivery confirmation to ${o.customer_email}` : "No customer email on this order"}
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/30 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Mail className={`h-3.5 w-3.5 ${emailBusyId === o.id ? "animate-pulse" : ""}`} />
                      {delivered ? "Resend email" : "Send email"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
