import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";
import { toastPromise } from "@/lib/toast-utils";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { adminListAllOrders, type AdminOrder } from "@/lib/admin.functions";
import { adminUpdateOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/260519/orders")({ component: Orders });

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

const statusTone = (s: string) => {
  const v = s.toLowerCase();
  if (v === "paid" || v === "fulfilled") return "success";
  if (v === "pending" || v === "processing") return "info";
  if (v === "refunded") return "warning";
  return "danger";
};

const firstItemName = (items: AdminOrder["items"]) => {
  const it = items?.[0];
  if (!it) return "—";
  const name = (it.name || it.title || "Item") as string;
  const rest = items.length > 1 ? ` +${items.length - 1}` : "";
  return name + rest;
};

function Orders() {
  const listFn = useServerFn(adminListAllOrders);
  const updateFn = useServerFn(adminUpdateOrder);
  const qc = useQueryClient();
  const { data: rows = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });

  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<{ order: AdminOrder; status: FulfillStatus } | null>(null);
  const [pending, setPending] = useState(false);
  const tabs = ["all", "paid", "pending", "failed", "refunded"] as const;

  const applyFulfillment = async () => {
    if (!confirm) return;
    setPending(true);
    try {
      await updateFn({ data: { id: confirm.order.id, order_status: confirm.status } });
      toast.success(`Order marked ${FULFILL_OPTIONS.find((o) => o.value === confirm.status)?.label}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setConfirm(null);
      if (confirm.status === "delivered") setOpen(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (tab === "all" ? true : r.status.toLowerCase() === tab))
      .filter((r) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        (r.customer_email || "").toLowerCase().includes(q) ||
        firstItemName(r.items).toLowerCase().includes(q),
      );
  }, [rows, tab, query]);

  const toggleAll = () => {
    if (filtered.every((r) => selected.has(r.id))) {
      const next = new Set(selected);
      filtered.forEach((r) => next.delete(r.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((r) => next.add(r.id));
      setSelected(next);
    }
  };

  const setStatus = async (id: string, source: "card" | "crypto", payment: "paid" | "refunded" | "failed") => {
    if (source === "crypto") {
      toast("Crypto orders update automatically via webhook.");
      return;
    }
    toastPromise(
      updateFn({ data: { id, payment_status: payment } }).then(() => {
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
        qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      }),
      {
        loading: `Marking order ${payment}…`,
        success: `Order marked ${payment}`,
        error: (e) => (e as Error).message,
      },
    );
  };

  const bulkRefund = async () => {
    const ids = Array.from(selected);
    toastPromise(
      (async () => {
        for (const id of ids) {
          const row = rows.find((r) => r.id === id);
          if (row && row.source === "card") {
            try { await updateFn({ data: { id, payment_status: "refunded" } }); } catch { /* ignore */ }
          }
        }
        setSelected(new Set());
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
        qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      })(),
      {
        loading: `Refunding ${ids.length} order${ids.length > 1 ? "s" : ""}…`,
        success: `Refunded ${ids.length} order${ids.length > 1 ? "s" : ""}`,
        error: (e) => (e as Error).message,
      },
    );
  };

  const bulkExport = () => {
    const chosen = rows.filter((r) => selected.has(r.id));
    const csv = [
      "id,source,email,product,amount_inr,status,created_at",
      ...chosen.map((r) =>
        [r.id, r.source, r.customer_email ?? "", firstItemName(r.items).replaceAll(",", " "), r.amount_inr, r.status, r.created_at].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    toast.success(`Exported ${chosen.length} orders`);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Real-time orders from card and crypto checkouts."
        actions={
          <>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex h-8 items-center gap-1.5 rounded-md border border-white/[0.06] bg-[#111113] px-3 text-[12px] text-white hover:border-white/10 disabled:opacity-50"
            >
              <Filter className="h-3 w-3" /> {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#18181B] p-0.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative rounded-md px-2.5 py-1 text-[11.5px] capitalize transition ${
                  tab === t ? "text-white" : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                {tab === t && (
                  <motion.span layoutId="order-tab" className="absolute inset-0 rounded-md bg-white/[0.07]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                )}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex h-8 w-full max-w-xs items-center gap-2 rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 sm:w-64">
            <Search className="h-3.5 w-3.5 text-[#71717A]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order ID, email, product"
              className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-[#52525B]"
            />
          </div>
        </div>

        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 border-b border-white/[0.06] bg-[#2563EB]/[0.07] px-5 py-2 text-[12px]">
            <span className="text-white">{selected.size} selected</span>
            <button onClick={bulkExport} className="rounded-md px-2 py-1 text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white">Export CSV</button>
            <button onClick={bulkRefund} className="rounded-md px-2 py-1 text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white">Refund</button>
            <button onClick={() => setSelected(new Set())} className="ml-auto rounded-md px-2 py-1 text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white">Clear</button>
          </motion.div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-[#52525B]">
                <th className="w-10 px-5 py-2.5">
                  <input type="checkbox" checked={filtered.length > 0 && filtered.every((r) => selected.has(r.id))} onChange={toggleAll} className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-transparent accent-[#2563EB]" />
                </th>
                <th className="px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Customer</th>
                <th className="px-3 py-2.5 font-medium">Product</th>
                <th className="px-3 py-2.5 font-medium">Amount</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center"><Loader size={40} className="mx-auto" /></td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[12.5px] text-[#71717A]">No orders match your filters.</td></tr>
              )}
              {filtered.map((r) => {
                const isOpen = open === r.id;
                const shortId = r.id.slice(0, 8);
                return (
                  <Fragment key={r.id}>
                    <tr onClick={() => setOpen(isOpen ? null : r.id)} className="cursor-pointer border-b border-white/[0.04] text-[12.5px] transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-transparent accent-[#2563EB]" />
                      </td>
                      <td className="px-3 py-3 font-mono text-[12px] text-white">
                        #{shortId}
                        <span className="ml-2 rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] uppercase text-[#A1A1AA]">{r.source}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col leading-tight">
                          <span className="text-white">{r.customer_email || <span className="text-[#71717A]">guest</span>}</span>
                          <span className="text-[11px] text-[#71717A]">{r.payment_provider || "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#D4D4D8]">{firstItemName(r.items)}</td>
                      <td className="px-3 py-3 tabular-nums text-white">{inr(r.amount_inr)}</td>
                      <td className="px-3 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-2 tabular-nums text-[#A1A1AA]">
                          {dt(r.created_at)}
                          <ChevronDown className={`h-3 w-3 transition ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <tr key={`${r.id}-d`}>
                          <td colSpan={7} className="bg-[#0B0B0E] p-0">
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                              <div className="grid grid-cols-1 gap-6 px-12 py-5 sm:grid-cols-3">
                                <div>
                                  <div className="text-[10.5px] uppercase tracking-wider text-[#52525B]">Customer</div>
                                  <div className="mt-1.5 text-[12.5px] text-white">{r.customer_email || "guest"}</div>
                                  <div className="text-[11.5px] text-[#A1A1AA]">{r.source === "crypto" ? "Crypto checkout" : (r.payment_provider || "manual")}</div>
                                </div>
                                <div>
                                  <div className="text-[10.5px] uppercase tracking-wider text-[#52525B]">Items</div>
                                  <ul className="mt-1.5 space-y-1 text-[12px] text-[#D4D4D8]">
                                    {(r.items ?? []).map((it, i) => {
                                      const ed = (it as { edition_name?: string }).edition_name;
                                      return (
                                        <li key={i}>
                                          {(it.name || it.title || "Item")} × {(it.qty ?? it.quantity ?? 1)}
                                          {ed && <span className="ml-1 text-emerald-400/80">· {ed}</span>}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                                <div>
                                  <div className="text-[10.5px] uppercase tracking-wider text-[#52525B]">Total</div>
                                  <div className="mt-1.5 text-[13px] text-white tabular-nums">{inr(r.amount_inr)}</div>
                                  <div className="text-[11.5px] text-[#A1A1AA]">Placed {dt(r.created_at)}</div>
                                  {r.paid_at && <div className="text-[11.5px] text-[#A1A1AA]">Paid {dt(r.paid_at)}</div>}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-12 py-3">
                                {r.source === "card" && (
                                  <MarkAsDropdown
                                    current={r.order_status}
                                    onPick={(status) => setConfirm({ order: r, status })}
                                  />
                                )}
                                {r.source === "card" && r.status !== "paid" && (
                                  <button onClick={() => setStatus(r.id, r.source, "paid")} className="rounded-md border border-white/[0.06] bg-[#111113] px-3 py-1.5 text-[11.5px] hover:border-white/10">Mark paid</button>
                                )}
                                {r.source === "card" && r.status !== "refunded" && (
                                  <button onClick={() => setStatus(r.id, r.source, "refunded")} className="rounded-md border border-white/[0.06] bg-[#111113] px-3 py-1.5 text-[11.5px] hover:border-white/10">Refund</button>
                                )}
                                <button
                                  onClick={() => { navigator.clipboard?.writeText(r.id); toast(`Copied ${shortId}`); }}
                                  className="rounded-md border border-white/[0.06] bg-[#111113] px-3 py-1.5 text-[11.5px] hover:border-white/10"
                                >Copy ID</button>
                                {r.customer_email && (
                                  <a href={`mailto:${r.customer_email}`} className="rounded-md border border-white/[0.06] bg-[#111113] px-3 py-1.5 text-[11.5px] hover:border-white/10">Email customer</a>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 text-[11.5px] text-[#A1A1AA]">
          <span>Showing {filtered.length} of {rows.length}</span>
        </div>
      </Card>

      <AnimatePresence>
        {confirm && (
          <ConfirmFulfillModal
            order={confirm.order}
            status={confirm.status}
            pending={pending}
            onClose={() => (!pending && setConfirm(null))}
            onConfirm={applyFulfillment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MarkAsDropdown({ current, onPick }: { current: string | null; onPick: (s: FulfillStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const MENU_H = 200;
  const MENU_W = 176;

  const place = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const openUp = b.top > MENU_H + 8;
    const top = openUp ? b.top - MENU_H - 6 : b.bottom + 6;
    let left = b.left;
    if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8;
    setPos({ left, top });
  };

  useEffect(() => {
    if (!open) return;
    place();
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onScroll = () => place();
    document.addEventListener("mousedown", h);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", h);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const currentLabel = FULFILL_OPTIONS.find((o) => o.value === current)?.label;
  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-[#111113] px-3 py-1.5 text-[11.5px] text-white hover:border-white/10"
      >
        {currentLabel ? `Status: ${currentLabel}` : "Mark as"}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", left: pos.left, top: pos.top, width: MENU_W, zIndex: 100 }}
          className="overflow-hidden rounded-md border border-white/[0.08] bg-[#18181B] shadow-2xl"
        >
          {FULFILL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setOpen(false); onPick(opt.value); }}
              className={`block w-full px-3 py-2 text-left text-[12px] hover:bg-white/[0.06] ${current === opt.value ? "text-white" : "text-[#D4D4D8]"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}


function ConfirmFulfillModal({
  order, status, pending, onClose, onConfirm,
}: {
  order: AdminOrder;
  status: FulfillStatus;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const label = FULFILL_OPTIONS.find((o) => o.value === status)?.label ?? status;
  const totalQty = (order.items ?? []).reduce((s, it) => s + (it.qty ?? it.quantity ?? 1), 0);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h3 className="text-[14px] font-semibold text-white">Mark as {label}?</h3>
          <button onClick={onClose} className="rounded p-1 text-[#A1A1AA] hover:bg-white/[0.06] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-[12.5px]">
          <div className="flex justify-between">
            <span className="text-[#71717A]">Order</span>
            <span className="font-mono text-white">#{order.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Customer</span>
            <span className="text-white">{order.customer_email || "guest"}</span>
          </div>
          <div>
            <div className="mb-1 text-[#71717A]">Items ({totalQty})</div>
            <ul className="space-y-1 rounded-md border border-white/[0.06] bg-[#0B0B0E] px-3 py-2 text-[12px] text-[#D4D4D8]">
              {(order.items ?? []).map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>{(it.name || it.title || "Item")}</span>
                  <span className="text-[#A1A1AA]">× {(it.qty ?? it.quantity ?? 1)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between border-t border-white/[0.06] pt-3">
            <span className="text-[#71717A]">Total</span>
            <span className="tabular-nums text-white">₹{order.amount_inr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-[#0B0B0E] px-5 py-3">
          <button
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-white/[0.06] bg-[#111113] px-3 py-1.5 text-[12px] text-white hover:border-white/10 disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="rounded-md bg-[#2563EB] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {pending ? "Saving…" : label}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
