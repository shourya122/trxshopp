import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCryptoOrder } from "@/lib/oxapay.functions";
import { CheckCircle2, Clock, XCircle, ExternalLink, Copy, DollarSign, ShoppingBag } from "lucide-react";
import { PageLoader } from "@/components/Loader";
import { toast } from "sonner";
import trxshopLogo from "@/assets/trxshop-logo.png";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "Order Confirmation — TRXSHOP" },
      { name: "description", content: "Your TRXSHOP order confirmation." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 bg-black text-white">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-white/60">{error.message}</p>
          <button
            onClick={() => { reset(); router.invalidate(); }}
            className="px-5 py-2 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-dvh flex items-center justify-center text-white bg-black">
      <p>Order not found.</p>
    </div>
  ),
});

type OrderItem = {
  name?: string;
  title?: string;
  qty?: number;
  quantity?: number;
  price?: number;
  price_cents?: number;
  edition_name?: string | null;
  cover_image?: string | null;
};

function useFmt() {
  const { format } = useCurrency();
  return (n: number) => format(Number(n || 0) * 100, { decimals: 2 });
}

function OrderPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getCryptoOrder);
  const fmtINR = useFmt();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
    refetchInterval: (q) => {
      const res = q.state.data;
      if (!res?.ok) return 5000;
      const s = res.order.status;
      if (s === "paid" || s === "confirmed" || s === "failed" || s === "expired") return false;
      return 5000;
    },
  });

  if (isLoading) return <PageLoader label="Loading order" />;

  if (!data?.ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black text-white px-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="text-sm text-white/60">{data?.error || "We couldn't locate this order."}</p>
          <Link to="/" className="inline-block text-[#1D9BF0] text-sm">← Back to store</Link>
        </div>
      </div>
    );
  }

  const order = data.order;
  const items = ((order.items as unknown) as OrderItem[]) || [];
  const status = order.status;
  const isPaid = status === "paid" || status === "confirmed";
  const isFailed = status === "failed" || status === "expired";
  const isPending = !isPaid && !isFailed;

  const orderRef =
    order.order_number ||
    (order.id ? order.id.slice(0, 8).toUpperCase() : "");

  const totalItems = items.reduce((s, i) => s + Number(i.qty ?? i.quantity ?? 1), 0);
  const subtotalPreTax = Number(order.amount_inr || 0);
  // display "including taxes" line like the reference (approx 18% GST included)
  const includedTax = +(subtotalPreTax - subtotalPreTax / 1.18).toFixed(2);

  const paymentLabel =
    order.payment_method_label ||
    (order.payment_provider === "cashfree"
      ? "Cashfree · UPI / Card"
      : order.payment_provider === "oxapay"
      ? "Crypto (OxaPay)"
      : order.payment_provider === "manual"
      ? "Bank Deposit"
      : "—");

  const addr = order.shipping_address as
    | { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string }
    | null
    | undefined;

  const copyRef = () => {
    navigator.clipboard.writeText(orderRef);
    toast.success("Order reference copied");
  };

  const paymentHint = (() => {
    if (order.payment_ref) return `Ref · ${order.payment_ref}`;
    return `Payment Method · ${paymentLabel}`;
  })();

  return (
    <div className="min-h-dvh bg-black text-white">
      {/* Top bar with centered logo */}
      <header className="w-full flex items-start justify-center pt-2 pb-2 border-b border-white/[0.02]">
        <Link to="/">
          <img src={trxshopLogo} alt="TRXSHOP" className="h-14 md:h-16 w-auto" />
        </Link>
      </header>

      <div className="mx-auto max-w-6xl px-5 md:px-8 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 lg:gap-14">
        {/* Left column — confirmation + details */}
        <section className="min-w-0">
          {/* Confirmation header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="shrink-0 grid place-items-center w-11 h-11 rounded-full border-2 border-[#1D9BF0]">
              {isPaid ? (
                <CheckCircle2 className="w-6 h-6 text-[#1D9BF0]" strokeWidth={2} />
              ) : isFailed ? (
                <XCircle className="w-6 h-6 text-red-400" strokeWidth={2} />
              ) : (
                <Clock className="w-6 h-6 text-[#1D9BF0] animate-pulse" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0">
              <button onClick={copyRef} className="group inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/90">
                <span>Confirmation #{orderRef}</span>
                <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
              </button>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">
                Thank you{order.customer_name ? `, ${order.customer_name.split(" ")[0]}` : ""}!
              </h1>
            </div>
          </div>

          {/* Status card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6 mb-5">
            <h2 className="text-lg font-bold mb-2">
              {isPaid ? "Your order is confirmed" : isPending ? "Your order is being processed" : "Your order was not completed"}
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              {isPaid && "Payment received. We'll deliver your keys to your email shortly."}
              {isPending && "We're waiting for payment to settle. This page updates automatically."}
              {isFailed && "We didn't receive your payment. You can try again from the store."}
            </p>
            {paymentHint && (
              <p className="mt-3 text-sm text-white/80">{paymentHint}</p>
            )}
          </div>

          {/* Order details card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Order details</h2>
              <Link to="/account" className="text-sm text-[#0045A3] hover:underline">
                View account
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold mb-2">Contact information</h3>
                <p className="text-sm text-white/70 break-all">{order.customer_email || "—"}</p>
                {order.customer_phone && (
                  <p className="text-sm text-white/70 mt-1">{order.customer_phone}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Payment method</h3>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span className="grid place-items-center w-7 h-6 rounded bg-white/[0.08] border border-white/10">
                    <DollarSign className="w-3.5 h-3.5 text-white/80" />
                  </span>
                  <span>{paymentLabel} · {fmtINR(subtotalPreTax)}</span>
                </div>

                {addr && (
                  <div className="mt-5">
                    <h3 className="text-sm font-bold mb-2">Billing address</h3>
                    <address className="not-italic text-sm text-white/70 leading-relaxed">
                      {addr?.line1 && <>{addr.line1}<br/></>}
                      {addr?.line2 && <>{addr.line2}<br/></>}
                      {(addr?.postal_code || addr?.city || addr?.state) && (
                        <>{[addr?.postal_code, addr?.city, addr?.state].filter(Boolean).join(" ")}<br/></>
                      )}
                      {addr?.country && <>{addr.country}</>}
                    </address>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-5 justify-between">
            <p className="text-sm text-white/60">
              Need help? <Link to="/contactus" className="text-[#0045A3] hover:underline">Contact us</Link>
            </p>
            <div className="flex flex-wrap gap-3">
              {isPending && order.pay_link && (
                <a
                  href={order.pay_link}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-sm font-semibold hover:bg-white/[0.1]"
                >
                  Resume payment <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0045A3] text-white text-sm font-semibold hover:bg-[#003a8c] transition-colors"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </section>

        {/* Right column — items + total */}
        <aside className="lg:sticky lg:top-8 h-max">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5 lg:hidden">
              <ShoppingBag className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/70">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
            </div>

            <ul className="space-y-4 max-h-[420px] overflow-y-auto overflow-x-hidden pt-2 pr-2 pl-1">
              {items.map((it, i) => {
                const name = it.name || it.title || "Item";
                const qty = Number(it.qty ?? it.quantity ?? 1);
                const unit = typeof it.price === "number" ? it.price : (Number(it.price_cents ?? 0) / 100);
                return (
                  <li key={i} className="flex items-start gap-4">
                    <div className="relative shrink-0 w-20 h-20 rounded-lg bg-white/[0.06] border border-white/10">
                      <div className="absolute inset-0 rounded-lg overflow-hidden">
                        {it.cover_image ? (
                          <img src={it.cover_image} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-white/40">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-black text-[11px] font-semibold grid place-items-center border border-white/20 shadow-sm">
                        {qty}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug break-words">{name}</p>
                      {it.edition_name && (
                        <p className="text-[11px] text-white/50 mt-0.5">{it.edition_name}</p>
                      )}
                    </div>
                    <div className="text-sm text-white/80 tabular-nums whitespace-nowrap">
                      {fmtINR(unit * qty)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold">Total</span>
                <div className="text-right">
                  <span className="text-xs text-white/50 mr-2">INR</span>
                  <span className="text-2xl font-bold tracking-tight">{fmtINR(subtotalPreTax)}</span>
                </div>
              </div>
              {includedTax > 0 && (
                <p className="text-xs text-white/50 text-right">Including ₹{includedTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in taxes</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
