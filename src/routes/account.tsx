import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/customers.functions";
import { listMyOrders, getOrderWithItems } from "@/lib/orders.functions";
import { toast } from "sonner";
import { ArrowLeft, Info, LogOut, ImageIcon, CheckCircle2, Circle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import trxshopLogo from "@/assets/trxshop-logo.png";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — TRXSHOP" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

// Theme tokens
const CYAN = "#22D3EE";
const BG = "#000000";
const PANEL = "#0A0A0A";
const BORDER = "rgba(34,211,238,0.15)";
const BORDER_SOFT = "rgba(255,255,255,0.08)";

type OrderRow = {
  id: string;
  order_number: string | null;
  total_amount: number;
  amount_cents: number;
  order_status: string;
  payment_status: string;
  status: string;
  created_at: string;
  customer_email: string;
  cover_image: string | null;
  item_count: number;
  first_item_name: string | null;
  first_product_id: string | null;
};

function statusLabel(o: Pick<OrderRow, "payment_status" | "order_status" | "status">) {
  const os = (o.order_status || "").toLowerCase();
  if (os === "delivered") return { label: "Delivered", tone: "ok" as const };
  if (os === "fulfilled") return { label: "Fulfilled", tone: "ok" as const };
  if (os === "cancelled") return { label: "Cancelled", tone: "bad" as const };
  if (os === "refunded" || o.payment_status === "refunded") return { label: "Refunded", tone: "bad" as const };
  if (os === "on_hold") return { label: "On hold", tone: "pending" as const };
  if (os === "processing") return { label: "Processing", tone: "pending" as const };
  if (os === "in_progress") return { label: "In progress", tone: "pending" as const };
  if (os === "unfulfilled") return { label: "Unfulfilled", tone: "pending" as const };
  if (o.payment_status === "paid" || o.status === "paid") return { label: "Paid", tone: "ok" as const };
  if (o.payment_status === "failed" || o.status === "failed") return { label: "Failed", tone: "bad" as const };
  return { label: "Due", tone: "pending" as const };
}

function headline(o: Pick<OrderRow, "order_status" | "payment_status" | "status">) {
  const os = (o.order_status || "").toLowerCase();
  if (os === "delivered") return "Delivered";
  if (os === "fulfilled") return "Complete";
  if (os === "processing") return "Processing";
  if (os === "in_progress") return "In progress";
  if (os === "on_hold") return "On hold";
  if (os === "unfulfilled") return "Unfulfilled";
  if (os === "cancelled") return "Cancelled";
  if (os === "refunded" || o.payment_status === "refunded") return "Refunded";
  if (o.payment_status === "paid" || o.status === "paid") return "Confirmed";
  return "Pending";
}

function OrderCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-5 animate-pulse"
      style={{ borderColor: BORDER_SOFT, background: PANEL }}
    >
      <div className="flex gap-5 items-center">
        <div className="w-24 h-24 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-3 w-56 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-10 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  const bar = (w: string, h = "h-3") => (
    <div className={`${h} rounded`} style={{ width: w, background: "rgba(255,255,255,0.08)" }} />
  );
  const card: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#000000",
    borderRadius: 14,
  };
  return (
    <div className="space-y-4 animate-pulse">
      {/* Amount + status message */}
      <div className="p-4 space-y-2" style={card}>
        {bar("40%", "h-5")}
        {bar("85%")}
      </div>
      {/* Timeline */}
      <div className="p-4 space-y-3" style={card}>
        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="space-y-1.5 flex-1">{bar("25%", "h-3.5")}{bar("18%", "h-2.5")}</div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="space-y-1.5 flex-1">{bar("30%", "h-3.5")}{bar("22%", "h-2.5")}</div>
        </div>
      </div>
      {/* Items */}
      <div style={card}>
        <div className="p-4 flex items-start gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="w-14 h-14 rounded-md shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="flex-1 space-y-1.5">{bar("70%", "h-3.5")}{bar("30%", "h-2.5")}</div>
          <div className="h-3.5 w-16 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between">{bar("20%")}{bar("18%")}</div>
          <div className="flex justify-between">{bar("18%")}{bar("14%")}</div>
          <div className="flex justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            {bar("15%", "h-4")}{bar("25%", "h-4")}
          </div>
        </div>
      </div>
      {/* Contact / billing / payment */}
      <div style={card}>
        <div className="p-4 grid grid-cols-[110px_1fr] gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          {bar("70%")}
          <div className="space-y-1.5">{bar("80%")}{bar("50%")}</div>
        </div>
        <div className="p-4 grid grid-cols-[110px_1fr] gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          {bar("70%")}
          <div className="space-y-1.5">{bar("60%")}{bar("75%")}{bar("40%")}</div>
        </div>
        <div className="p-4 grid grid-cols-[110px_1fr] gap-3">
          {bar("70%")}
          <div className="space-y-1.5">{bar("45%")}{bar("55%")}</div>
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchOrders = useServerFn(listMyOrders);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Awaited<ReturnType<typeof getMe>> | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ses } = await supabase.auth.getSession();
      if (!ses.session) { navigate({ to: "/signin" }); return; }
      try {
        const [meRes, ordersRes] = await Promise.all([fetchMe({}), fetchOrders({})]);
        setMe(meRes);
        setOrders(ordersRes as OrderRow[]);
      } catch (err) {
        toast.error("Failed to load", { description: (err as Error).message });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, fetchMe, fetchOrders]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) { toast.error("Min 6 characters"); return; }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success("Password updated");
      setNewPwd("");
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    } finally {
      setSavingPwd(false);
    }
  };

  const initial = (me?.customer?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-dvh" style={{ background: BG, color: "#E6F6FA" }}>
      {/* Top bar */}
      <header style={{ borderBottom: `1px solid ${BORDER_SOFT}` }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={trxshopLogo} alt="TRXSHOP logo" className="h-8 sm:h-10 w-auto" />
          </Link>
          <div
            className="w-9 h-9 rounded-full grid place-items-center text-xs font-semibold"
            style={{ border: `1px solid ${BORDER}`, color: CYAN, background: PANEL }}
          >
            {initial}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="space-y-2">
          <button
            onClick={() => setTab("orders")}
            className="block w-full text-left text-lg font-semibold transition"
            style={{ color: tab === "orders" ? "#FFFFFF" : "rgba(230,246,250,0.4)" }}
          >
            Orders
          </button>
          <button
            onClick={() => setTab("profile")}
            className="block w-full text-left text-lg font-semibold transition"
            style={{ color: tab === "profile" ? "#FFFFFF" : "rgba(230,246,250,0.4)" }}
          >
            Profile
          </button>
          <button
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 text-xs hover:text-white"
            style={{ color: "rgba(230,246,250,0.5)" }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </aside>

        {/* Main */}
        <main>
          {tab === "orders" && (
            <div className="space-y-4">
              {loading ? (
                <>
                  <OrderCardSkeleton />
                  <OrderCardSkeleton />
                </>
              ) : orders.length === 0 ? (
                <div
                  className="rounded-2xl p-10 text-center"
                  style={{ border: `1px solid ${BORDER_SOFT}`, background: PANEL }}
                >
                  <p className="text-sm" style={{ color: "rgba(230,246,250,0.5)" }}>
                    No orders yet. <Link to="/" style={{ color: CYAN }}>Browse store →</Link>
                  </p>
                </div>
              ) : (
                orders.map((o) => {
                  const s = statusLabel(o);
                  const total = ((o.total_amount || o.amount_cents) / 100).toFixed(2);
                  const ref = o.order_number ? `#${o.order_number}` : `#${o.id.slice(0, 6)}`;
                  const title = headline(o);
                  return (
                    <button
                      key={o.id}
                      onClick={() => setOpenId(o.id)}
                      className="w-full text-left rounded-2xl p-5 group transition"
                      style={{
                        border: `1px solid ${BORDER_SOFT}`,
                        background: PANEL,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER_SOFT; }}
                    >
                      <div className="flex gap-5 items-center">
                        <div
                          className="w-24 h-24 rounded-xl overflow-hidden shrink-0"
                          style={{ background: "#000", border: `1px solid ${BORDER_SOFT}` }}
                        >
                          {o.cover_image
                            ? <img src={o.cover_image} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full grid place-items-center" style={{ color: "rgba(255,255,255,0.15)" }}><ImageIcon className="w-6 h-6" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold truncate" style={{ color: "#E6F6FA" }}>{title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm" style={{ color: "rgba(230,246,250,0.55)" }}>
                            <span>{ref}</span>
                            <span>·</span>
                            <span>{format(total * 100, { decimals: 2 })}</span>
                            <span
                              className="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-xs"
                              style={
                                s.tone === "ok"
                                  ? { border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", background: "rgba(34,197,94,0.1)" }
                                  : s.tone === "bad"
                                  ? { border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", background: "rgba(239,68,68,0.08)" }
                                  : { border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", background: "rgba(239,68,68,0.08)" }
                              }
                            >
                              <Info className="w-3 h-3" />
                              {s.label}
                            </span>
                          </div>
                        </div>
                        {o.first_product_id ? (
                          <Link
                            to="/products/$id"
                            params={{ id: o.first_product_id }}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition"
                            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(0,91,211,1)", background: "#FFFFFF" }}
                          >
                            Buy again
                          </Link>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-6 max-w-lg">
              <div className="rounded-2xl p-6" style={{ border: `1px solid ${BORDER_SOFT}`, background: PANEL }}>
                <h2 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>Profile</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt style={{ color: "rgba(230,246,250,0.5)" }}>Name</dt>
                    <dd>{me?.customer?.name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt style={{ color: "rgba(230,246,250,0.5)" }}>Email</dt>
                    <dd className="break-all">{me?.customer?.email}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl p-6" style={{ border: `1px solid ${BORDER_SOFT}`, background: PANEL }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: "#FFFFFF" }}>Change password</h2>
                <form onSubmit={updatePassword} className="flex gap-3 items-end">
                  <label className="flex-1 block text-xs" style={{ color: "rgba(230,246,250,0.5)" }}>New password
                    <input
                      type="password" minLength={6} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                      style={{ background: "#0A0D11", border: `1px solid ${BORDER_SOFT}`, color: "#E6F6FA" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = CYAN)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER_SOFT)}
                    />
                  </label>
                  <button
                    type="submit" disabled={savingPwd}
                    className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                    style={{ background: "#FFFFFF", color: "rgba(0,91,211,1)", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    {savingPwd ? "Saving..." : "Update"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      <OrderDetailDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

type OrderDetail = Awaited<ReturnType<typeof getOrderWithItems>>;

function OrderDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const fetchOne = useServerFn(getOrderWithItems);
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setData(null); return; }
    setLoading(true);
    fetchOne({ data: { id } })
      .then((r) => setData(r))
      .catch((e: Error) => toast.error("Failed", { description: e.message }))
      .finally(() => setLoading(false));
  }, [id, fetchOne]);

  const open = id != null;
  const order = data && data.ok ? data.order : null;
  const items = (data && data.ok ? data.items : []) as Array<{
    id: string;
    title: string;
    quantity: number;
    price_cents: number;
    edition_name: string | null;
    product_id?: string | null;
    cover_image?: string | null;
  }>;
  const orderItemsMeta = (order?.items ?? []) as Array<{ product_id?: string; cover_image?: string }>;

  const s = order ? statusLabel({
    payment_status: order.payment_status as string,
    order_status: order.order_status as string,
    status: order.status as string,
  }) : null;
  const title = order ? headline({
    payment_status: order.payment_status as string,
    order_status: order.order_status as string,
    status: order.status as string,
  }) : "Order";

  const total = order ? ((order.total_amount || order.amount_cents) / 100).toFixed(2) : "0.00";
  const subtotal = items.reduce((sum, i) => sum + (i.price_cents * i.quantity), 0) / 100;
  const ref = order?.order_number ? `#${order.order_number}` : id ? `#${id.slice(0, 6)}` : "";
  const addr = (order?.shipping_address ?? null) as null | Record<string, string>;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const createdShort = order ? fmtDate(order.created_at as string) : "";
  const paidShort = order?.paid_at ? fmtDate(order.paid_at as string) : "";

  const isPaid = s?.tone === "ok";
  const isPending = s?.tone === "pending";
  const provider = String(order?.payment_provider || "—");
  const providerLabel =
    provider === "cashfree" ? "Cashfree UPI" :
    provider === "oxapay" ? "OxaPay (Crypto)" :
    provider === "manual" ? "Bank Deposit" :
    provider.charAt(0).toUpperCase() + provider.slice(1);

  const rowBorder: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.12)" };
  const cardStyle: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#000000",
    borderRadius: 14,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="w-[calc(100vw-1rem)] max-w-2xl p-0 max-h-[90dvh] overflow-y-auto !duration-100 data-[state=open]:!slide-in-from-left-0 data-[state=closed]:!slide-out-to-left-0 data-[state=open]:!slide-in-from-top-0 data-[state=closed]:!slide-out-to-top-0"
        style={{ background: "#000000", border: "1px solid rgba(255,255,255,0.12)", color: "#FFFFFF", boxShadow: "none" }}
      >
        <div className="p-4 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
              <button onClick={onClose} className="p-1 rounded hover:bg-white/10 mt-1 shrink-0"><ArrowLeft className="w-5 h-5" style={{ color: "#FFFFFF" }} /></button>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-2xl font-bold truncate">Order {ref}</h3>
                {order && (
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {title} {createdShort}
                  </p>
                )}
              </div>
            </div>
            {order && items[0]?.product_id && (
              <Link
                to="/products/$id"
                params={{ id: items[0].product_id }}
                className="shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap"
                style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(0,91,211,1)", background: "#FFFFFF" }}
              >
                Buy again
              </Link>
            )}
          </div>


          {loading || !order ? (
            <OrderDetailSkeleton />
          ) : (
            <>
              {/* Amount + status message */}
              <div className="p-4" style={cardStyle}>
                <p className="text-lg font-semibold">
                  {format(total * 100, { decimals: 2 })}
                </p>
                {s && (
                  <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {isPending && "This order has a pending payment. The balance will be updated when payment is received."}
                    {isPaid && "Payment received. Your order has been confirmed."}
                    {s.tone === "bad" && "Payment failed. You can retry from the product page."}
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="p-4" style={cardStyle}>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    {isPaid
                      ? <CheckCircle2 className="w-4 h-4 mt-0.5" style={{ color: "#FFFFFF" }} />
                      : <Circle className="w-4 h-4 mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
                    <div>
                      <p className="text-sm font-semibold">Complete</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {isPaid ? (paidShort || createdShort) : "Pending"}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 mt-0.5" style={{ color: "#FFFFFF" }} />
                    <div>
                      <p className="text-sm font-semibold">Confirmed</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{createdShort}</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Items */}
              <div style={cardStyle}>
                {items.map((it, idx) => {
                  const cover = it.cover_image || orderItemsMeta[idx]?.cover_image || null;
                  return (
                    <div key={it.id} className="p-4 flex justify-between items-start gap-3" style={rowBorder}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0" style={{ background: "#000", border: "1px solid rgba(255,255,255,0.12)" }}>
                          {cover
                            ? <img src={cover} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full grid place-items-center" style={{ color: "rgba(255,255,255,0.2)" }}><ImageIcon className="w-4 h-4" /></div>}
                          <span
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center text-[10px] font-bold"
                            style={{ background: "#FFFFFF", color: "#000000" }}
                          >
                            {it.quantity}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>{it.title}</p>
                          {it.edition_name && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{it.edition_name}</p>}
                        </div>
                      </div>
                      <p className="text-sm font-mono shrink-0">{format(it.price_cents * it.quantity, { decimals: 2 })}</p>
                    </div>
                  );
                })}
                <div className="p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <span>Subtotal</span><span className="font-mono">{format(subtotal * 100, { decimals: 2 })}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <span>Shipping</span><span>Free</span>
                  </div>
                  <div className="flex justify-between pt-2 font-semibold" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                    <span>Total</span>
                    <span>
                      <span className="text-xs mr-1" style={{ color: "rgba(255,255,255,0.5)" }}>INR</span>
                      <span className="font-mono" style={{ color: "#FFFFFF" }}>{format(total * 100, { decimals: 2 })}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact / billing / payment */}
              <div style={cardStyle}>
                <div className="p-4 grid grid-cols-[90px_minmax(0,1fr)] sm:grid-cols-[110px_1fr] gap-3 text-sm" style={rowBorder}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Contact</span>
                  <span className="break-all min-w-0">
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{order.customer_email as string}</span>
                    {order.customer_phone ? (<><br /><span style={{ color: "rgba(255,255,255,0.7)" }}>{order.customer_phone as string}</span></>) : null}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-[90px_minmax(0,1fr)] sm:grid-cols-[110px_1fr] gap-3 text-sm" style={rowBorder}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Billing address</span>
                  <span className="whitespace-pre-line leading-relaxed break-words min-w-0">
                    {addr
                      ? [
                          (order.customer_name as string) || addr.name,
                          addr.line1,
                          addr.line2,
                          [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" "),
                          addr.country,
                        ].filter(Boolean).join("\n") || "\n"
                      : "\n"}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-[90px_minmax(0,1fr)] sm:grid-cols-[110px_1fr] gap-3 text-sm">
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Payment</span>
                  <span>
                    <span className="font-medium">{providerLabel}</span>
                    <span className="block text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {format(total * 100, { decimals: 2 })} · {createdShort}
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
