"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Search, User, Trash2, Loader2 } from "lucide-react";
import cartIconAsset from "@/assets/header-cart-icon-v2.svg.asset.json";
import { Link, useLocation } from "@tanstack/react-router";

import { useCart } from "@/lib/cart";

import trxshopLogo from "@/assets/trxshop-logo.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { SearchModal } from "@/components/SearchModal";
import { PayWithCryptoButton } from "@/components/PayWithCryptoButton";
import { CartDrawerSkeleton } from "@/components/ProductDetailSkeleton";
import { AccountDialog } from "@/components/AccountDialog";



export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { items, count, total, remove, setQty, openCheckout, isLoading, checkoutUrl, hydrated } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    let current = false;
    const check = () => {
      raf = 0;
      const next = window.scrollY > 20;
      if (next !== current) {
        current = next;
        setScrolled(next);
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);


  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Global ⌘K / Ctrl+K to open search — the "expensive" keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Bump cart badge when count changes
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      const el = document.querySelector<HTMLElement>("[data-cart-target]");
      if (el) {
        el.style.animation = "cart-bump 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
        const t = setTimeout(() => { el.style.animation = ""; }, 450);
        return () => clearTimeout(t);
      }
    }
    prevCount.current = count;
  }, [count]);

  // Smoothly slide the announcement bar up as the user scrolls, while the
  // navbar stays pinned. We translate the whole sticky wrapper by the scroll
  // distance (clamped to the announcement height) so the navbar ends up flush
  // at the top. rAF-throttled, transform-only — no layout, no reflow.
  // On /checkout, use hide-on-scroll-down / show-on-scroll-up behavior instead.
  const isCheckout = location.pathname.startsWith("/checkout");
  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let hidden = false;
    const apply = () => {
      raf = 0;
      const el = wrapperRef.current;
      if (!el) return;
      const scrollY = Math.max(window.scrollY, 0);

      if (isCheckout) {
        const delta = scrollY - lastY;
        const h = el.getBoundingClientRect().height || 80;
        if (scrollY <= 4) {
          hidden = false;
        } else if (delta > 4) {
          hidden = true;
        } else if (delta < -4) {
          hidden = false;
        }
        el.style.transform = hidden ? `translate3d(0, -${Math.ceil(h) + 8}px, 0)` : `translate3d(0, 0, 0)`;
        el.style.transition = "transform 300ms ease";
        lastY = scrollY;
        return;
      }

      const ann = announcementRef.current;
      const max = ann ? Math.ceil(ann.getBoundingClientRect().height) : 0;
      const y = scrollY >= max ? max + 8 : Math.min(scrollY, max);
      el.style.transition = "";
      el.style.transform = `translate3d(0, -${y}px, 0)`;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isCheckout]);


  const links = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/games" },
    { label: "Contact", href: "/#contact" },
  ];

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  const handleCheckout = () => {
    const ok = openCheckout();
    if (ok) setCartOpen(false);
  };

  return (
    <>
      <div
        ref={wrapperRef}
        className="sticky top-0 z-50 will-change-transform [backface-visibility:hidden]"
      >
        {/* Announcement bar — slides up smoothly with scroll via transform */}
        {!location.pathname.startsWith("/checkout") && (
          <div
            ref={announcementRef}
            role="region"
            aria-label="Site announcement"
            className="block bg-black text-white text-[10px] sm:text-[12px] text-center px-3 sm:px-4 whitespace-nowrap overflow-hidden py-1.5 sm:py-2 tracking-[0.12em] sm:tracking-[0.14em] uppercase font-semibold shadow-[0_8px_0_#000]"
          >
            <div className="truncate">GRAND OPENING — 10% OFF ORDERS ABOVE ₹299 · INSTANT DIGITAL DELIVERY</div>
          </div>
        )}

        <header
          className={`text-white font-['Inter'] font-medium mx-0 rounded-none border-b border-white/10 overflow-visible transition-all duration-300 ease-[cubic-bezier(0.7,0,0.3,1)] sm:overflow-hidden sm:rounded-2xl sm:border ${
            scrolled
              ? "sm:mx-auto sm:max-w-[min(85%,64rem)] sm:bg-black/90 sm:backdrop-blur-md sm:border-white/10 sm:shadow-[0_8px_32px_rgba(0,0,0,0.5)] bg-black/90 backdrop-blur-sm"
              : "sm:mx-auto sm:max-w-6xl sm:bg-transparent sm:backdrop-blur-0 sm:border-transparent sm:shadow-none bg-transparent"
          }`}
        >



      {/* Main bar */}
      <div className="w-full px-4 sm:px-8 h-12 sm:h-16 grid grid-cols-3 items-center">

        {/* Left: nav (desktop) / menu btn (mobile) */}
        <nav className="hidden sm:flex items-center gap-6 lg:gap-8 self-center h-full">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className={`group relative text-sm leading-none flex items-center font-medium overflow-hidden ${
                isActive(l.href) ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              <span className="relative inline-block overflow-hidden h-[1em] leading-[1em]">
                <span className="block transition-transform duration-300 ease-[cubic-bezier(0.7,0,0.3,1)] group-hover:-translate-y-full">
                  {l.label}
                </span>
                <span aria-hidden className="absolute left-0 top-full block transition-transform duration-300 ease-[cubic-bezier(0.7,0,0.3,1)] group-hover:-translate-y-full text-white">
                  {l.label}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <button
          className="sm:hidden justify-self-start text-white p-2 -ml-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Center: logo */}
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center justify-self-center"
        >
          <img src={trxshopLogo} alt="TRXSHOP logo" className="h-12 sm:h-20 w-auto" />
        </Link>

        {/* Right: icons */}
        <div className="flex items-center gap-0.5 sm:gap-1 justify-self-end self-center">
          <div
            role="group"
            aria-label="Currency"
            className="mr-1 hidden sm:inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] p-0.5"
          >
            {(["INR", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                aria-label={c === "INR" ? "Show prices in Indian rupees" : "Show prices in US dollars"}
                className={`h-6 w-7 rounded-full text-[12px] font-semibold leading-none transition-colors ${
                  currency === c ? "bg-white text-black" : "text-white/55 hover:text-white"
                }`}
              >
                {c === "INR" ? "₹" : "$"}
              </button>
            ))}
          </div>
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="p-2 inline-flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)}>
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-label="Account"
              className="p-2 inline-flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
          </AccountDialog>


          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Cart"
            data-cart-target
            className="relative p-2 inline-flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <img src={cartIconAsset.url} alt="" className="w-6 h-6 block" />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center leading-none">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — CSS-only, GPU transform to avoid blur+height layout jank */}
      <div
        className={`sm:hidden absolute left-0 right-0 top-full border-t border-white/10 bg-black origin-top transition-[opacity,transform] duration-200 ease-out will-change-[transform,opacity] ${
          mobileOpen
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-95 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <nav className="px-4 py-2 flex flex-col">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className={`py-3 text-sm font-medium ${
                isActive(l.href) ? "text-white" : "text-white/60"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>


      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Cart drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-black text-white border-l border-white/10 p-0 flex flex-col [&>button]:hidden font-['Poppins',sans-serif] data-[state=open]:!duration-200 data-[state=closed]:!duration-150"
        >
          {!hydrated ? (
            <CartDrawerSkeleton />
          ) : items.length === 0 ? (
            <>
              <div className="flex justify-end px-5 pt-5">
                <SheetClose className="p-1 text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </SheetClose>
              </div>
              <SheetHeader className="sr-only">
                <SheetTitle>Your cart is empty</SheetTitle>
              </SheetHeader>
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 -mt-10">
                <h2 className="text-3xl font-bold tracking-tight text-white">Your cart is empty</h2>
                <p className="text-sm text-white/70">
                  Sign in to your account to check out faster.
                </p>
                <SheetClose asChild>
                  <Link
                    to="/games"
                    className="mt-4 inline-block px-8 py-3.5 !bg-white !text-black text-sm font-semibold rounded-md shadow-md hover:!bg-white/90 transition"
                  >
                    Continue shopping
                  </Link>
                </SheetClose>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <SheetHeader className="space-y-0">
                  <SheetTitle className="text-2xl font-bold flex items-baseline gap-2 text-white">
                    Cart <span className="text-base font-medium text-white/60">{count}</span>
                  </SheetTitle>
                </SheetHeader>
                <SheetClose className="p-1 text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </SheetClose>
              </div>

              <div className="flex-1 overflow-y-auto px-5">
                <ul className="divide-y divide-white/10">
                  {items.map((it) => (
                    <li key={it.id} className="flex gap-5 py-6">
                      <div className="w-24 h-32 shrink-0 rounded-md overflow-hidden bg-white/5">
                        {it.image && (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base font-semibold leading-snug text-white">{it.name}</p>
                          <span className="text-base font-semibold whitespace-nowrap text-white">
                            {format(it.price * it.qty * 100)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="text-base font-semibold text-white">{format(it.price * 100)}</span>
                          {it.old && it.old > it.price && (
                            <span className="text-sm text-white/40 line-through">{format(it.old * 100)}</span>
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="inline-flex items-center border border-white/20 rounded">
                            <button
                              onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}
                              aria-label="Decrease quantity"
                              className="w-10 h-10 flex items-center justify-center text-base text-white/80 hover:bg-white/10 transition"
                            >
                              −
                            </button>
                            <span className="w-10 text-center text-base select-none text-white">{it.qty}</span>
                            <button
                              onClick={() => setQty(it.id, it.qty + 1)}
                              aria-label="Increase quantity"
                              className="w-10 h-10 flex items-center justify-center text-base text-white/80 hover:bg-white/10 transition"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => remove(it.id)}
                            aria-label="Remove"
                            className="p-2 text-white/50 hover:text-white"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Estimated total</span>
                  <span className="text-lg font-bold text-white">{format(total * 100)}</span>
                </div>
                <p className="text-xs text-white/60">Taxes and shipping calculated at checkout.</p>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!checkoutUrl || isLoading}
                  className="block w-full text-center py-3.5 bg-white !text-black text-sm font-semibold rounded-md hover:bg-white/90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Check out
                </button>
                <PayWithCryptoButton
                  disabled={items.length === 0}
                  amount={total}
                  items={items.map((it) => ({
                    name: it.name,
                    qty: it.qty,
                    price: it.price,
                    variantId: it.variantId,
                  }))}
                />

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      </header>
      </div>

      
    </>
  );

}


