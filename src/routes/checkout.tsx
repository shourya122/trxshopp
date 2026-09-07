import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCart, type CartItem } from "@/lib/cart";
import { placeOrder } from "@/lib/orders.functions";
import { validateCoupon } from "@/lib/coupons.functions";
import { PayWithCashfreeButton } from "@/components/PayWithCashfreeButton";
import { PayWithCryptoButton } from "@/components/PayWithCryptoButton";
import { COUNTRIES } from "@/lib/countries";
import { STATES_BY_COUNTRY } from "@/lib/states";
import {
  validatePostal, postalPlaceholder, sanitizePostal, postalMaxLen,
  validatePhone,
} from "@/lib/address-validation";
import { validateEmail } from "@/lib/email-validation";
import { toast } from "sonner";
import {
  Loader2, User, Mail, Phone, MapPin, Home, Building2,
  Tag, ShieldCheck, Truck, Lock, ChevronDown, CheckCircle2, AlertCircle,
  Package,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>) => ({
    buyNow: s.buyNow === 1 || s.buyNow === "1" ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout — TRXSHOP" },
      { name: "description", content: "Complete your TRXSHOP purchase." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Coupon = { code: string; discount_type: "percent" | "fixed"; discount_value: number };

const inputBase =
  "w-full h-12 pl-11 pr-3 rounded-lg bg-white/[0.03] border text-[15px] text-white placeholder:text-white/40 focus:outline-none focus-visible:outline-none! focus:ring-2 transition-[box-shadow,border-color,background-color] duration-300 ease-out";
const inputOk =
  "border-transparent focus:border-transparent focus:ring-[#1D9BF0]/70";
const inputBad =
  "border-red-500/70 bg-red-500/[0.04] focus:border-red-500 focus:ring-red-500/25";
const selectBase =
  "w-full h-12 pl-11 pr-9 rounded-lg bg-white/[0.03] border text-[15px] text-white focus:outline-none focus-visible:outline-none! focus:ring-2 appearance-none transition-[box-shadow,border-color,background-color] duration-300 ease-out";

function Field({
  icon: Icon,
  children,
  select = false,
  invalid = false,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  select?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <Icon
        className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          invalid ? "text-red-400" : "text-white/40"
        }`}
      />
      {children}
      {select && (
        <ChevronDown
          className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            invalid ? "text-red-400" : "text-white/40"
          }`}
        />
      )}
    </div>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ width: 22, height: 22 }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M23.6361 9.33998C22.212 8.71399 20.6892 8.25903 19.0973 8C18.9018 8.33209 18.6734 8.77875 18.5159 9.13408C16.8236 8.89498 15.1469 8.89498 13.4857 9.13408C13.3283 8.77875 13.0946 8.33209 12.8974 8C11.3037 8.25903 9.77927 8.71565 8.35518 9.3433C5.48276 13.4213 4.70409 17.3981 5.09342 21.3184C6.99856 22.6551 8.84487 23.467 10.66 23.9983C11.1082 23.4189 11.5079 22.8029 11.8523 22.1536C11.1964 21.9195 10.5683 21.6306 9.9748 21.2951C10.1323 21.1856 10.2863 21.071 10.4351 20.9531C14.0551 22.5438 17.9881 22.5438 21.5649 20.9531C21.7154 21.071 21.8694 21.1856 22.0251 21.2951C21.4299 21.6322 20.8 21.9211 20.1442 22.1553C20.4885 22.8029 20.8865 23.4205 21.3364 24C23.1533 23.4687 25.0013 22.6567 26.9065 21.3184C27.3633 16.7738 26.1261 12.8335 23.6361 9.33998ZM12.3454 18.9075C11.2587 18.9075 10.3676 17.9543 10.3676 16.7937C10.3676 15.6331 11.2397 14.6783 12.3454 14.6783C13.4511 14.6783 14.3422 15.6314 14.3232 16.7937C14.325 17.9543 13.4511 18.9075 12.3454 18.9075ZM19.6545 18.9075C18.5678 18.9075 17.6767 17.9543 17.6767 16.7937C17.6767 15.6331 18.5488 14.6783 19.6545 14.6783C20.7602 14.6783 21.6514 15.6314 21.6323 16.7937C21.6323 17.9543 20.7602 18.9075 19.6545 18.9075Z" fill="#5865F2"/>
    </svg>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-red-400 pl-1 pt-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}

function CountryCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const selected = COUNTRIES.find((c) => c.name === value) ?? null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => { setHighlight(0); }, [query, open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const pick = (name: string) => {
    onChange(name);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={open ? query : selected ? `${selected.flag} ${selected.name}` : query}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); const pickIt = results[highlight]; if (pickIt) pick(pickIt.name); }
            else if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); }
          }}
          placeholder="Search country…"
          className="w-full h-12 pl-11 pr-9 rounded-lg bg-white/[0.03] border border-transparent text-[15px] text-white placeholder:text-white/40 focus:outline-none focus-visible:outline-none! focus:ring-2 focus:ring-[#1D9BF0]/70 transition-[box-shadow,border-color,background-color] duration-300 ease-out"
        />
        <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg bg-[#0A0B0E] border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9)] overflow-hidden">
          <ul ref={listRef} className="max-h-64 overflow-y-auto py-1" role="listbox">
            {results.length === 0 && (
              <li className="px-4 py-3 text-sm text-white/50">No matches</li>
            )}
            {results.map((c, i) => {
              const active = i === highlight;
              const isSel = c.name === value;
              return (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={isSel}
                  onMouseDown={(e) => { e.preventDefault(); pick(c.name); }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-2 ${
                    active ? "bg-white/10 text-white" : "text-white/85"
                  } ${isSel ? "font-semibold" : ""}`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[11px] text-white/40">{c.dial}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}



type FieldKey = "name" | "email" | "phone" | "line1" | "city" | "stateName" | "postalCode";

const BUY_NOW_KEY = "trxshop_buy_now";
const BUY_NOW_TTL_MS = 15 * 60 * 1000;

function readBuyNow(): CartItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BUY_NOW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // New shape: { items, ts }. Legacy: CartItem[].
    if (Array.isArray(parsed) && parsed.length) return parsed as CartItem[];
    if (parsed && Array.isArray(parsed.items) && parsed.items.length) {
      if (typeof parsed.ts === "number" && Date.now() - parsed.ts > BUY_NOW_TTL_MS) {
        sessionStorage.removeItem(BUY_NOW_KEY);
        return null;
      }
      return parsed.items as CartItem[];
    }
  } catch {}
  return null;
}

function clearBuyNowStorage() {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(BUY_NOW_KEY); } catch {}
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8 lg:gap-12 animate-pulse">
        <div className="space-y-6 min-w-0">
          <div className="h-8 w-40 bg-white/[0.06] rounded" />
          <div className="space-y-3">
            <div className="h-12 w-full bg-white/[0.04] rounded-lg" />
            <div className="h-12 w-full bg-white/[0.04] rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-white/[0.04] rounded-lg" />
              <div className="h-12 bg-white/[0.04] rounded-lg" />
            </div>
          </div>
          <div className="h-6 w-48 bg-white/[0.06] rounded mt-4" />
          <div className="space-y-3">
            <div className="h-12 w-full bg-white/[0.04] rounded-lg" />
            <div className="h-12 w-full bg-white/[0.04] rounded-lg" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 bg-white/[0.04] rounded-lg" />
              <div className="h-12 bg-white/[0.04] rounded-lg" />
              <div className="h-12 bg-white/[0.04] rounded-lg" />
            </div>
          </div>
          <div className="h-12 w-full bg-white/[0.06] rounded-lg mt-4" />
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <div className="h-5 w-32 bg-white/[0.06] rounded" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/[0.06] rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/3 bg-white/[0.04] rounded" />
                </div>
                <div className="h-4 w-14 bg-white/[0.06] rounded" />
              </div>
            ))}
            <div className="border-t border-white/[0.06] pt-4 space-y-2">
              <div className="h-4 w-full bg-white/[0.04] rounded" />
              <div className="h-6 w-1/2 bg-white/[0.08] rounded ml-auto" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const cart = useCart();
  const { buyNow } = Route.useSearch();
  const isBuyNow = buyNow === 1;
  const [minDelay, setMinDelay] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setMinDelay(false), 600);
    return () => clearTimeout(t);
  }, []);
  if (!cart.hydrated || minDelay) return <CheckoutSkeleton />;
  return <CheckoutInner cart={cart} isBuyNow={isBuyNow} />;
}

function CheckoutInner({ cart, isBuyNow }: { cart: ReturnType<typeof useCart>; isBuyNow: boolean }) {
  const [buyNowItems, setBuyNowItems] = useState<CartItem[] | null>(
    () => (isBuyNow ? readBuyNow() : null),
  );
  useEffect(() => {
    if (!isBuyNow) {
      // Cart-driven checkout: don't allow a stale buy-now entry to override cart.
      if (buyNowItems) setBuyNowItems(null);
      clearBuyNowStorage();
      return;
    }
    const items = readBuyNow();
    if (items) setBuyNowItems(items);
  }, [isBuyNow]);
  // Clean up stored buy-now on navigation away — prevents leaking into a later cart checkout.
  useEffect(() => () => { clearBuyNowStorage(); }, []);
  const items = isBuyNow && buyNowItems ? buyNowItems : cart.items;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const couponInputRef = useRef<HTMLInputElement | null>(null);
  const openDiscount = () => {
    setSummaryOpen(true);
    setTimeout(() => couponInputRef.current?.focus(), 50);
  };


  const total = isBuyNow && buyNowItems
    ? buyNowItems.reduce((s, i) => s + i.price * i.qty, 0)
    : cart.total;
  const clear = () => {
    if (isBuyNow) {
      clearBuyNowStorage();
      setBuyNowItems(null);
    } else {
      cart.clear();
    }
  };
  const navigate = useNavigate();
  const submit = useServerFn(placeOrder);
  const checkCoupon = useServerFn(validateCoupon);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [discord, setDiscord] = useState("");
  const [country, setCountry] = useState("India");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cashfree" | "crypto">("cashfree");
  const [paymentLocked, setPaymentLocked] = useState(false);


  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    name: false, email: false, phone: false, line1: false,
    city: false, stateName: false, postalCode: false,
  });
  const [attempted, setAttempted] = useState(false);
  const touch = (k: FieldKey) => setTouched((t) => ({ ...t, [k]: true }));
  const touchAll = () => setTouched({
    name: true, email: true, phone: true, line1: true,
    city: true, stateName: true, postalCode: true,
  });

  const stateOptions = useMemo(() => STATES_BY_COUNTRY[country] ?? null, [country]);

  const discount = coupon
    ? coupon.discount_type === "percent"
      ? Math.min(total, (total * coupon.discount_value) / 100)
      : Math.min(total, coupon.discount_value)
    : 0;
  const grand = Math.max(0, total - discount);

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) e.name = "Enter your full name";
    else if (name.trim().length < 2) e.name = "Name looks too short";
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    const phoneErr = validatePhone(country, phone);
    if (phoneErr) e.phone = phoneErr;
    if (!line1.trim()) e.line1 = "Enter your address";
    if (!city.trim()) e.city = "Enter a city";
    if (!stateName) e.stateName = "Select a state / region";
    const postalErr = postalCode
      ? validatePostal(country, stateName, postalCode)
      : "Enter your postal code";
    if (postalErr) e.postalCode = postalErr;
    return e;
  }, [name, email, phone, line1, city, stateName, postalCode, country]);

  const show = (k: FieldKey): string | undefined =>
    (attempted || touched[k]) ? errors[k] : undefined;

  const formValid = Object.keys(errors).length === 0;

  const apply = async () => {
    if (!code.trim()) return;
    setApplying(true);
    setCouponError(null);
    try {
      const res = await checkCoupon({ data: { code: code.trim() } });
      if (res.ok) { setCoupon(res.coupon as Coupon); setCouponError(null); toast.success(`Applied ${res.coupon.code}`); }
      else { setCoupon(null); setCouponError(res.error || "Enter a valid discount code"); }
    } catch (err) { setCouponError((err as Error).message || "Failed to apply code"); }
    finally { setApplying(false); }
  };

  const placeOrderHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !items.length) return;
    setAttempted(true);
    touchAll();
    if (!formValid) {
      return;
    }
    setLoading(true);
    try {
      const res = await submit({
        data: {
          email,
          items: items.map((i) => ({
            product_id: i.variantId || i.id,
            variantId: i.variantId,
            name: i.name,
            qty: i.qty,
            edition_name: i.edition?.name,
            options: i.options,
          })),
          coupon_code: coupon?.code,
          customer_name: name.trim() || undefined,
          customer_phone: phone.trim() || undefined,
          customer_discord: discord.trim() || undefined,
          shipping_address: {
            line1: line1.trim() || undefined,
            line2: line2.trim() || undefined,
            city: city.trim() || undefined,
            state: stateName || undefined,
            postal_code: postalCode.trim() || undefined,
            country: country || undefined,
          },
          payment_method_label:
            paymentMethod === "cashfree" ? "Cashfree · UPI / Card" : "Crypto (OxaPay)",
        },
      });
      if (res?.ok) {
        clear();
        toast.success("Order placed");
        navigate({ to: "/order/$id", params: { id: res.orderId } });
      } else {
        toast.error("Order failed", { description: (res as { error?: string })?.error || "Try again." });
      }
    } catch (err) {
      toast.error("Order failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-dvh bg-[#000000] text-white flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <h1 className="font-['Rajdhani',sans-serif] text-3xl font-bold uppercase tracking-wide">Cart Empty</h1>
          <p className="text-sm text-white/60">Add an item before checking out.</p>
          <Link to="/" className="inline-block px-5 py-2 rounded-[2px] border border-[#1D9BF0]/50 text-[#1D9BF0] text-xs uppercase tracking-[0.2em] hover:bg-[#1D9BF0]/10 transition-colors">
            Browse store
          </Link>
        </div>
      </div>
    );
  }

  const totalUnits = items.reduce((s, i) => s + i.qty, 0);
  const OrderSummary = (

    <section className="rounded-[2px] bg-black overflow-hidden">
      {/* Mobile: Add discount button */}
      <div className="md:hidden px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={openDiscount}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${
            summaryOpen
              ? "bg-white text-black border-white"
              : "bg-white/[0.04] text-white/90 border-white/15 hover:bg-white/[0.08]"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Add discount
        </button>
      </div>
      {/* Mobile: collapsible header */}

      <button
        type="button"
        onClick={() => setSummaryOpen((v) => !v)}
        aria-expanded={summaryOpen}
        className="md:hidden w-full flex items-center gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/10 text-left"
      >
        <div className="relative shrink-0 w-10 h-12">
          <div className="w-full h-full rounded-[3px] bg-white/[0.05] overflow-hidden">
            {items[0]?.image ? (
              <img src={items[0].image} alt="" className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/30">
                <Package className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-white/90 text-[13px]">
            <span className="font-semibold">Total</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
          </div>
          <div className="text-[11px] text-white/50">{totalUnits} item{totalUnits > 1 ? "s" : ""}</div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-white/40 mr-1.5 align-middle">INR</span>
          <span className="font-['Rajdhani',sans-serif] text-lg text-white font-bold align-middle">₹{grand.toFixed(2)}</span>
        </div>
      </button>

      {/* Desktop header */}
      <header className="hidden md:flex items-center justify-between px-5 py-3 bg-black">
        <span className="text-[11px] uppercase tracking-[0.25em] text-white/50">Order Summary</span>
        <span className="text-[11px] text-white/40">{totalUnits} item{totalUnits > 1 ? "s" : ""}</span>
      </header>

      <div className={`${summaryOpen ? "block" : "hidden"} md:block p-5 space-y-4`}>
        <div className="relative">
          <ul className="space-y-3 max-h-[280px] overflow-y-auto overflow-x-visible pr-2 pt-2 checkout-items-scroll">
            {items.map((i) => (
              <li key={i.id} className="flex items-start gap-3">
                <div className="relative shrink-0 w-16 h-20">
                  <div className="w-full h-full rounded-[3px] bg-white/[0.03] overflow-hidden">
                    {i.image ? (
                      <img
                        src={i.image}
                        alt={i.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-white/30">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 grid place-items-center rounded-full bg-white text-[10px] font-semibold text-black ring-2 ring-[#000000] z-10">
                    {i.qty}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white/90 leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '14px' }}>{i.name}</p>
                  {i.edition?.name && (
                    <p className="text-emerald-300/80 mt-0.5" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '14px' }}>{i.edition.name}</p>
                  )}
                  {i.options && Object.keys(i.options).length > 0 && (
                    <p className="text-white/50 mt-0.5" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '13px' }}>
                      {Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-white/90 whitespace-nowrap" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '14px' }}>
                  ₹{(i.price * i.qty).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          {items.length > 3 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-1">
              <span className="pointer-events-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-white/80 shadow-lg">
                Scroll for more items <span aria-hidden>↓</span>
              </span>
            </div>
          )}
        </div>

        {/* Coupon */}
        <div className="pt-4 space-y-2">

          <div className="flex gap-2">
            <Field icon={Tag} invalid={!!couponError}>
              <input
                ref={couponInputRef}

                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); if (couponError) setCouponError(null); }}
                placeholder="Discount code"
                className={`${inputBase} ${couponError ? inputBad : inputOk} tracking-wider`}
                style={{ fontFamily: "var(--x-text-field-font-family)" }}
              />
            </Field>
            <button
              type="button"
              onClick={apply}
              disabled={applying || !code.trim()}
              className="px-4 h-11 rounded-lg bg-[#005bd1] text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#004fb3] disabled:opacity-40 disabled:hover:bg-[#005bd1] transition-colors whitespace-nowrap"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </button>
          </div>
          {couponError && (
            <p className="flex items-center gap-1.5 text-[13px] text-red-400 pl-1 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {couponError}
            </p>
          )}
        </div>

        <div className="pt-3 space-y-2">
          {coupon && (
            <div className="flex justify-between text-sm text-emerald-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {coupon.code}
              </span>
              <span className="font-mono">−₹{discount.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-baseline pt-4">
          <span className="uppercase tracking-wider text-white font-bold" style={{ fontWeight: 700 }}>Total</span>
          <span className="font-['Rajdhani',sans-serif] text-2xl text-white font-bold" style={{ fontWeight: 700 }}>
            <span className="text-white/50 text-sm font-normal mr-1.5">INR</span>₹{grand.toFixed(2)}
          </span>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-dvh bg-[#000000] text-white py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">


        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_400px] gap-8 lg:gap-10 items-start">
          {/* LEFT — Form */}
          <form onSubmit={placeOrderHandler} noValidate className="space-y-8 order-2 md:order-1">
            {/* Contact */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white tracking-tight normal-case">
                Contact
              </h2>
              <div>
                <Field icon={User} invalid={!!show("name")}>
                  <input
                    type="text" placeholder="Full name" value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => touch("name")}
                    aria-invalid={!!show("name")}
                    className={`${inputBase} ${show("name") ? inputBad : inputOk}`}
                  />
                </Field>
                <FieldError message={show("name")} />
              </div>
              <div>
                <Field icon={Mail} invalid={!!show("email")}>
                  <input
                    type="email" placeholder="Email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => touch("email")}
                    aria-invalid={!!show("email")}
                    className={`${inputBase} ${show("email") ? inputBad : inputOk}`}
                  />
                </Field>
                <FieldError message={show("email")} />
              </div>
              <div>
                <Field icon={Phone} invalid={!!show("phone")}>
                  <input
                    type="tel" inputMode="numeric"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D+/g, ""))}
                    onBlur={() => touch("phone")}
                    aria-invalid={!!show("phone")}
                    className={`${inputBase} ${show("phone") ? inputBad : inputOk}`}
                  />
                </Field>
                <FieldError message={show("phone")} />
              </div>
              <div>
                <Field icon={DiscordIcon}>
                  <input
                    type="text"
                    placeholder="Discord ID (optional)"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    className={`${inputBase} ${inputOk}`}
                  />
                </Field>
                <p className="text-[11px] text-white/50 pl-1 pt-1">
                  For faster order updates & support
                </p>
              </div>
            </section>

            {/* Shipping */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white tracking-tight normal-case">
                Billing address
              </h2>

              <CountryCombobox
                value={country}
                onChange={(next) => { setCountry(next); setStateName(""); }}
              />


              <div>
                <Field icon={Home} invalid={!!show("line1")}>
                  <input
                    type="text" placeholder="Address line 1" value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    onBlur={() => touch("line1")}
                    aria-invalid={!!show("line1")}
                    className={`${inputBase} ${show("line1") ? inputBad : inputOk}`}
                  />
                </Field>
                <FieldError message={show("line1")} />
              </div>

              <Field icon={Building2}>
                <input
                  type="text" placeholder="Apartment, suite (optional)" value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className={`${inputBase} ${inputOk}`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Field icon={MapPin} invalid={!!show("city")}>
                    <input
                      type="text" placeholder="City" value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onBlur={() => touch("city")}
                      aria-invalid={!!show("city")}
                      className={`${inputBase} ${show("city") ? inputBad : inputOk}`}
                    />
                  </Field>
                  <FieldError message={show("city")} />
                </div>
                <div>
                  {stateOptions ? (
                    <Field icon={MapPin} select invalid={!!show("stateName")}>
                      <select
                        value={stateName}
                        onChange={(e) => { setStateName(e.target.value); touch("stateName"); }}
                        onBlur={() => touch("stateName")}
                        aria-invalid={!!show("stateName")}
                        className={`${selectBase} ${show("stateName") ? inputBad : inputOk}`}
                      >
                        <option value="" className="bg-[#000000]">Select state</option>
                        {stateOptions.map((s) => (
                          <option key={s} value={s} className="bg-[#000000]">{s}</option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <Field icon={MapPin} invalid={!!show("stateName")}>
                      <input
                        type="text" placeholder="State / Region" value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        onBlur={() => touch("stateName")}
                        aria-invalid={!!show("stateName")}
                        className={`${inputBase} ${show("stateName") ? inputBad : inputOk}`}
                      />
                    </Field>
                  )}
                  <FieldError message={show("stateName")} />
                </div>
              </div>

              <div>
                <Field icon={MapPin} invalid={!!show("postalCode")}>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="postal-code"
                    placeholder={postalPlaceholder(country) || "PIN / postal code"}
                    value={postalCode}
                    maxLength={postalMaxLen(country)}
                    onChange={(e) => setPostalCode(sanitizePostal(country, e.target.value))}
                    onBlur={() => touch("postalCode")}
                    onPaste={(e) => {
                      e.preventDefault();
                      const t = e.clipboardData.getData("text").slice(0, 32);
                      setPostalCode(sanitizePostal(country, t));
                    }}
                    aria-invalid={!!show("postalCode")}
                    className={`${inputBase} ${show("postalCode") ? inputBad : inputOk}`}
                  />
                </Field>
                {show("postalCode") ? (
                  <FieldError message={show("postalCode")} />
                ) : postalCode ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-emerald-400 pl-1 pt-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Looks valid for {country}
                  </p>
                ) : null}
              </div>
            </section>


            {/* Payment */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white tracking-tight normal-case">
                Payment
              </h2>
              <p className="text-[12px] text-white/50 -mt-1">All transactions are secure and encrypted.</p>

              <div className="rounded-[24px] border border-white/10 overflow-hidden divide-y divide-white/10 bg-white/[0.02]">
                {/* Cashfree option */}
                <label
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    paymentLocked
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  } ${
                    paymentMethod === "cashfree" ? "bg-[#1D9BF0]/10" : paymentLocked ? "" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cashfree"
                    checked={paymentMethod === "cashfree"}
                    onChange={() => !paymentLocked && setPaymentMethod("cashfree")}
                    disabled={paymentLocked}
                    className="w-4 h-4 accent-[#1D9BF0]"
                  />
                  <span className="flex-1 text-sm text-white font-medium">
                    Cards, UPI, Netbanking, Wallets — Cashfree
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="flex items-center justify-center h-7 px-2 rounded bg-white">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 w-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://cdn.simpleicons.org/visa/1A1F71"; }} />
                    </span>
                    <span className="flex items-center justify-center h-7 px-2 rounded bg-white">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 w-auto object-contain" />
                    </span>
                    <span className="text-[11px] px-1.5 py-1 rounded bg-white/10 text-white/70">+9</span>
                  </span>
                </label>
                {paymentMethod === "cashfree" && (
                  <div className="px-4 py-3 bg-white/[0.02] text-[12px] text-white/60 leading-relaxed">
                    You'll be redirected to Cashfree to complete your purchase securely.
                  </div>
                )}

                {/* Crypto option */}
                <label
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    paymentLocked
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  } ${
                    paymentMethod === "crypto" ? "bg-amber-500/10" : paymentLocked ? "" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="crypto"
                    checked={paymentMethod === "crypto"}
                    onChange={() => !paymentLocked && setPaymentMethod("crypto")}
                    disabled={paymentLocked}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="flex-1 text-sm text-white font-medium">
                    Cryptocurrency (USDT, BTC, LTC & more)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold">
                    CRYPTO
                  </span>
                </label>
                {paymentMethod === "crypto" && (
                  <div className="px-4 py-3 bg-white/[0.02] text-[12px] text-white/60 leading-relaxed">
                    You'll be redirected to OxaPay in a new tab to complete your crypto payment.
                  </div>
                )}
              </div>

              <div className="pt-2">
                {paymentMethod === "cashfree" ? (
                  formValid ? (
                    <PayWithCashfreeButton
                      items={items.map((i) => ({
                        name: i.name, qty: i.qty, price: i.price,
                        variantId: i.variantId, product_id: i.variantId || String(i.id),
                        edition_name: i.edition?.name,
                        edition_price_cents: i.edition?.priceCents,
                        options: i.options,
                      }))}
                      amount={grand}
                      name={name}
                      email={email}
                      phone={phone}
                      discord={discord || undefined}
                      shipping={{
                        line1, line2: line2 || undefined, city, state: stateName,
                        postal_code: postalCode,
                        country: COUNTRIES.find((c) => c.name === country)?.code || "IN",
                      }}
                      couponCode={coupon?.code}
                      disabled={paymentLocked || !items.length}
                      onCreated={() => clear()}
                      onInitiate={() => setPaymentLocked(true)}
                      onError={() => setPaymentLocked(false)}
                      className="w-full h-12 rounded-[16px] bg-[#005bd1] text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#004bb1] shadow-[0_0_24px_-6px_rgba(0,91,209,0.6)] inline-flex items-center justify-center gap-2 transition-colors"
                      label="Pay Now"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAttempted(true); touchAll(); }}
                      disabled={paymentLocked}
                      className="w-full h-12 rounded-[16px] bg-[#005bd1]/40 text-white/80 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#005bd1]/50 inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Pay Now
                    </button>
                  )
                ) : formValid ? (
                    <PayWithCryptoButton
                      items={items.map((i) => ({
                        name: i.name, qty: i.qty, price: i.price,
                        variantId: i.variantId,
                        product_id: i.variantId || String(i.id),
                        edition_name: i.edition?.name,
                        options: i.options,
                      }))}
                      amount={grand}
                      name={name}
                      email={email}
                      phone={phone}
                      discord={discord || undefined}
                      shipping={{
                        line1, line2: line2 || undefined, city, state: stateName,
                        postal_code: postalCode,
                        country: COUNTRIES.find((c) => c.name === country)?.code || "IN",
                      }}
                      couponCode={coupon?.code}
                      disabled={paymentLocked || !items.length}
                      onInitiate={() => setPaymentLocked(true)}
                      onError={() => setPaymentLocked(false)}
                      className="w-full h-12 rounded-[16px] bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-95 inline-flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      label="Pay with Crypto"
                    />
                ) : (
                    <button
                      type="button"
                      onClick={() => { setAttempted(true); touchAll(); }}
                      disabled={paymentLocked}
                      className="w-full h-12 rounded-[16px] bg-gradient-to-r from-amber-500/40 to-orange-600/40 text-white/70 text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-95 inline-flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Pay with Crypto
                    </button>
                )}
              </div>
            </section>

          </form>

          {/* RIGHT — Order Summary (sticky) */}
          <aside className="order-1 md:order-2 md:sticky md:top-8">
            {OrderSummary}
          </aside>
        </div>

        <div className="text-center pt-2">
          <Link to="/" className="text-[11px] uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors">
            ← Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
