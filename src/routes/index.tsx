import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, ShoppingBag, ArrowRight, Zap, ShieldCheck, Headphones, Star, MessageCircle, BadgeCheck } from "lucide-react";

import { listProducts } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { Marquee } from "@/components/ui/marquee";
import { Loader } from "@/components/Loader";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { flyToCart } from "@/lib/fly-to-cart";
import { canAddToCart } from "@/lib/rate-limit";
import { toast } from "sonner";

import xboxLogo from "@/assets/logos/Xbox.svg.asset.json";
import spotifyLogo from "@/assets/logos/Spotify.svg.asset.json";
import discordLogo from "@/assets/logos/Discord.svg.asset.json";
import chatgptLogo from "@/assets/logos/chatgpt-logo.png.asset.json";
import deepseekLogo from "@/assets/logos/DeepSeek.svg.asset.json";
import perplexityLogo from "@/assets/logos/Perplexity_AI.svg.asset.json";
import claudeLogo from "@/assets/logos/claude-logo.svg.asset.json";
import rockstarLogo from "@/assets/logos/Rockstar_Games.svg.asset.json";
import crunchyrollLogo from "@/assets/logos/Crunchyroll.svg.asset.json";
import steamLogo from "@/assets/logos/Steam.svg.asset.json";
import youtubeLogo from "@/assets/logos/YouTube.svg.asset.json";
import kimiLogo from "@/assets/logos/kimi.svg.asset.json";
import copilotLogo from "@/assets/logos/copilot.svg.asset.json";
import grokLogo from "@/assets/logos/grok.png.asset.json";
import geminiLogo from "@/assets/logos/gemini.svg.asset.json";
import adobeLogo from "@/assets/logos/adobe.svg.asset.json";
import canvaLogo from "@/assets/logos/canva.svg.asset.json";
import primeVideoLogo from "@/assets/logos/prime-video.svg.asset.json";
import cartIconAsset from "@/assets/cart-icon-v2.svg.asset.json";
import greenCheckAsset from "@/assets/check.png.asset.json";
import redCrossAsset from "@/assets/cross.png.asset.json";
import avatarMcp from "@/assets/mcpfp.png.asset.json";
import avatarMaster from "@/assets/masteroog.png.asset.json";
import avatarGirl from "@/assets/dp_for_girls.jpeg.asset.json";
import avatarWoody from "@/assets/woody2.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRXSHOP — Buy Cheap PC, PlayStation & Xbox Game Keys" },
      { name: "description", content: "Buy original PC, PlayStation, and Xbox game keys at the best prices. 100% genuine digital downloads with instant delivery." },
      { property: "og:title", content: "TRXSHOP — Buy Cheap PC, PlayStation & Xbox Game Keys" },
      { property: "og:description", content: "Original game keys at unbeatable prices. Instant digital delivery for PC, PlayStation, and Xbox." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trxshop.in/" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.in/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TRXSHOP",
          url: "https://trxshop.in/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://trxshop.in/games?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "TRXSHOP",
          url: "https://trxshop.in/",
          logo: "https://trxshop.in/favicon.ico",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-7000286871",
            email: "support@trxshop.in",
            contactType: "customer support",
            areaServed: "IN",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

const BRAND_LOGOS = [
  { src: steamLogo.url, alt: "Steam" },
  { src: xboxLogo.url, alt: "Xbox" },
  { src: rockstarLogo.url, alt: "Rockstar Games" },
  { src: spotifyLogo.url, alt: "Spotify" },
  { src: youtubeLogo.url, alt: "YouTube" },
  { src: primeVideoLogo.url, alt: "Prime Video" },
  { src: crunchyrollLogo.url, alt: "Crunchyroll" },
  { src: chatgptLogo.url, alt: "ChatGPT" },
  { src: claudeLogo.url, alt: "Claude" },
  { src: geminiLogo.url, alt: "Gemini" },
  { src: perplexityLogo.url, alt: "Perplexity" },
  { src: deepseekLogo.url, alt: "DeepSeek" },
  { src: copilotLogo.url, alt: "Copilot" },
  { src: grokLogo.url, alt: "Grok" },
  { src: kimiLogo.url, alt: "Kimi" },
  { src: adobeLogo.url, alt: "Adobe" },
  { src: canvaLogo.url, alt: "Canva" },
  { src: discordLogo.url, alt: "Discord" },
];

const PAYMENT_METHODS = [
  "UPI",
  "Google Pay",
  "PhonePe",
  "Paytm",
  "Visa",
  "Mastercard",
  "RuPay",
  "Net Banking",
  "₿ Bitcoin",
  "Ξ Ethereum",
  "USDT",
  "Ł Litecoin",
  "◎ Solana",
];

function HomePage() {
  const { data: fsProducts, isPending: productsPending } = useQuery({
    queryKey: ["products", "active", "home"],
    queryFn: () => listProducts({ activeOnly: true, max: 300 }),
    staleTime: 30_000,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, body, rating, product_title, time_label, verified")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .limit(6);
      if (error) return [];
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // Real catalogue counts per category (the product list above is capped at 80).
  const { data: catCounts } = useQuery({
    queryKey: ["home", "category-counts"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const countPlatform = async (p: string) => {
        const { count } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("active", true)
          .contains("platforms", [p]);
        return count ?? 0;
      };
      const [pc, ps, xbox, subs, total] = await Promise.all([
        countPlatform("pc"),
        countPlatform("ps"),
        countPlatform("xbox"),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("active", true)
          .in("category", ["subscription", "subscriptions", "streaming", "music", "digital-products", "digital products"])
          .then((r) => r.count ?? 0),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("active", true)
          .then((r) => r.count ?? 0),
      ]);
      return [
        { title: "PC / Steam", desc: "Steam accounts & PC titles", to: "/games/steam-games", count: pc },
        { title: "PlayStation", desc: "PS4 & PS5 digital games", to: "/games/playstation-games", count: ps },
        { title: "Xbox", desc: "Xbox & Game Pass titles", to: "/games/all", count: xbox },
        { title: "Subscriptions", desc: "Streaming, music & AI tools", to: "/games/subscriptions", count: subs },
        { title: "All Products", desc: "Browse the whole catalogue", to: "/games/all", count: total },
      ];
    },
  });



  // Full-page loader until products + window.load are ready
  const [pageReady, setPageReady] = useState(false);
  const [windowLoaded, setWindowLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.readyState === "complete") {
      setWindowLoaded(true);
      return;
    }
    const onLoad = () => setWindowLoaded(true);
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (!productsPending && windowLoaded) setPageReady(true);
  }, [productsPending, windowLoaded]);

  const all = fsProducts || [];

  const categories = (catCounts ?? []).filter((c) => c.count > 0);


  return (
    <div className="bg-[var(--home-bg)] text-white" style={{ fontFamily: "'Geist', Inter, sans-serif" }}>
      {/* Full-page loader */}
      <div
        aria-hidden={pageReady}
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-[var(--home-bg)] transition-opacity duration-500 ${pageReady ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <div className="flex flex-col items-center gap-6">
          <Loader size={120} />
          <div className="text-sm uppercase tracking-widest text-white/70">Loading TRX Shop</div>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section className="home-hero-wash relative overflow-hidden">
        <div aria-hidden className="home-dots pointer-events-none absolute inset-0 opacity-[0.25]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--home-bg)] to-transparent" />

        <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl"
          >
            Original games &amp; accounts,
            <br />
            <span className="home-accent-text">delivered in seconds, not days.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-sm text-white/70 sm:text-lg"
          >
            PC, PlayStation and Xbox games plus the software and subscriptions you actually use — every one
            genuine, priced far below retail, and sent to you within seconds after paying.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/games"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--home-accent)] px-7 py-3.5 text-[15px] font-semibold text-black shadow-[0_10px_40px_-12px_rgba(62,226,83,0.7)] transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              <ShoppingBag size={18} />
              Shop Now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/contactus"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-[var(--home-line)] bg-white/[0.04] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.09] sm:w-auto"
            >
              <MessageCircle size={18} />
              Talk to Support
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/70">
            {["Instant Delivery", "Secure Payments", "24/7 Support"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--home-accent)]" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* brand marquee */}
        <div className="relative border-y border-[var(--home-line)] bg-black/40 py-5">
          <Marquee speed={22} direction="right" className="!mt-0">
            {BRAND_LOGOS.map((logo, i) => (
              <div key={i} className="flex shrink-0 items-center px-7">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-8 w-auto select-none object-contain opacity-70 transition-opacity duration-300 hover:opacity-100 sm:h-10"
                />
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Shop by category</h2>
            <p className="mt-2 text-sm text-white/60 sm:text-base">
              Pick a category to narrow things down, or browse the whole catalogue.
            </p>
          </div>
          <Link
            to="/games/all"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--home-line)] px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            All products <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.title}
              to={c.to as any}
              className="group relative overflow-hidden rounded-2xl border border-[var(--home-line)] bg-[var(--home-panel)] p-5 transition-colors hover:border-[var(--home-accent)]/40 hover:bg-[var(--home-panel-2)]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "var(--home-accent-soft)" }}
              />
              <div className="relative">
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-white/55">{c.desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-[var(--home-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--home-accent)]">
                    {c.count} {c.count === 1 ? "product" : "products"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                    Browse <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ PRODUCT ROWS ============ */}
      <ProductRow
        id="games"
        title="Newly Added"
        linkTo="/games"
        linkLabel="View all newly added"
        pending={productsPending && !fsProducts}
        products={all.slice(0, 20)}
      />

      <ProductRow
        id="pc-games"
        title="PC Games"
        linkTo="/games/steam-games"
        linkLabel="View all PC games"
        pending={productsPending && !fsProducts}
        products={all
          .filter((p) => (p.platforms || []).some((pl) => String(pl).toLowerCase() === "pc"))
          .slice()
          .sort((a, b) => b.oldPriceCents - b.priceCents - (a.oldPriceCents - a.priceCents))
          .slice(0, 20)}
      />

      <ProductRow
        id="ps-games"
        title="PlayStation Games"
        linkTo="/games/playstation-games"
        linkLabel="View all PS games"
        pending={productsPending && !fsProducts}
        products={all
          .filter((p) => (p.platforms || []).some((pl) => String(pl).toLowerCase() === "ps"))
          .slice(0, 20)}
      />

      {/* ============ WHY CHOOSE ============ */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose TRX Shop</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
            We're here to make it simple — genuine products, fair prices, and real people when you need help.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            { icon: Zap, title: "Delivered in seconds", body: "Pay and your key or account details land straight in your inbox and order page." },
            { icon: ShieldCheck, title: "Genuine & verified", body: "Every product is checked before it ships — no shady keys, no surprises." },
            { icon: Headphones, title: "Real people, fast", body: "Reach us on the site, WhatsApp or email. Whoever answers can fix your issue." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-[var(--home-line)] bg-[var(--home-panel)] p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--home-accent-soft)] text-[var(--home-accent)]">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
            </div>
          ))}
        </div>

        {/* comparison table */}
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-[var(--home-line)] bg-[var(--home-panel)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.04]">
                <th className="p-4 text-left text-[15px] font-semibold sm:p-5">Features</th>
                <th className="p-4 text-center text-[15px] font-semibold text-[var(--home-accent)] sm:p-5">TRX Shop</th>
                <th className="p-4 text-center text-[15px] font-semibold text-white/50 sm:p-5">Other Stores</th>
              </tr>
            </thead>
            <tbody>
              {["Fast Delivery After Purchase", "Genuine & Verified Products", "Fair Pricing", "Customer Support"].map((feature) => (
                <tr key={feature} className="border-t border-[var(--home-line)]">
                  <td className="p-4 text-[15px] font-medium sm:p-5">{feature}</td>
                  <td className="p-4 text-center sm:p-5">
                    <img src={greenCheckAsset.url} alt="Yes" className="inline-block h-6 w-6 transition-transform duration-200 hover:scale-125" />
                  </td>
                  <td className="p-4 text-center sm:p-5">
                    <img src={redCrossAsset.url} alt="No" className="inline-block h-6 w-6 transition-transform duration-200 hover:scale-125" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ PAYMENTS ============ */}
      <section className="border-y border-[var(--home-line)] bg-black/40 py-12">
        <h2 className="px-5 text-center text-2xl font-bold tracking-tight sm:text-3xl">Pay the way you want</h2>
        <p className="mt-2 px-5 text-center text-sm text-white/60">
          UPI, cards and net banking in rupees, or crypto if you prefer.
        </p>
        <div className="mt-7">
          <Marquee speed={26} className="!mt-0">
            {PAYMENT_METHODS.map((m, i) => (
              <div key={i} className="shrink-0 px-2.5">
                <span className="inline-flex items-center rounded-full border border-[var(--home-line)] bg-[var(--home-panel)] px-5 py-2.5 text-sm font-medium text-white/80">
                  {m}
                </span>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ============ REVIEWS ============ */}
      {reviews && reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What customers say</h2>
            <p className="mt-3 text-sm text-white/60 sm:text-base">Real reviews from real orders.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[var(--home-line)] bg-[var(--home-panel)] p-6">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={i < Math.round(Number(r.rating) || 5) ? "fill-[var(--home-accent)] text-[var(--home-accent)]" : "text-white/20"}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/75">{r.body}</p>
                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-white/50">
                  <span className="inline-flex items-center gap-1.5 font-medium text-white/80">
                    {r.author_name}
                    {r.verified && <BadgeCheck size={14} className="text-[var(--home-accent)]" />}
                  </span>
                  <span>{r.time_label}</span>
                </div>
                {r.product_title && <p className="mt-2 truncate text-xs text-white/40">{r.product_title}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ FINAL CTA ============ */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="home-hero-wash relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--home-line)] px-6 py-16 text-center sm:py-20">
          <div aria-hidden className="home-dots pointer-events-none absolute inset-0 opacity-[0.2]" />
          <div className="relative">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex -space-x-3">
                {[avatarMcp.url, avatarMaster.url, avatarGirl.url, avatarWoody.url].map((src, i) => (
                  <img key={i} src={src} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20" />
                ))}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-[var(--home-accent)] text-[var(--home-accent)]" />
                  ))}
                </div>
                <p className="mt-1 text-xs font-medium text-white/70">100+ happy customers</p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Ready to find your next <span className="home-accent-text">digital product?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
              Browse the catalogue and get it delivered within seconds of paying.
            </p>
            <Link
              to="/games"
              className="group mt-8 inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--home-accent)] px-8 py-3.5 text-[15px] font-semibold text-black shadow-[0_10px_40px_-12px_rgba(62,226,83,0.7)] transition-transform hover:-translate-y-0.5"
            >
              Shop Now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductRow({
  id,
  title,
  linkTo,
  linkLabel,
  pending,
  products,
}: {
  id: string;
  title: string;
  linkTo: string;
  linkLabel: string;
  pending: boolean;
  products: Array<{
    id: string;
    variantId: string;
    slug: string;
    title: string;
    coverImage: string;
    screenshots: string[];
    priceCents: number;
    oldPriceCents: number;
    platforms: string[];
  }>;
}) {
  if (!pending && products.length === 0) return null;
  return (
    <section id={id} className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <Link
          to={linkTo}
          className="text-sm font-medium text-[var(--home-accent)] underline-offset-4 hover:underline"
        >
          {linkLabel}
        </Link>
      </div>
      <HorizontalScroller>
        {pending
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={`sk-${id}-${i}`} className="w-[42vw] shrink-0 sm:w-[28vw] lg:w-[21vw]">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p) => (
              <div key={p.id} className="w-[42vw] shrink-0 sm:w-[28vw] lg:w-[21vw]">
                <HomeProductCard
                  id={p.id}
                  variantId={p.variantId}
                  slug={p.slug || p.id}
                  title={p.title}
                  img={p.coverImage || p.screenshots[0] || ""}
                  sale={Math.round(p.priceCents / 100)}
                  regular={p.oldPriceCents > 0 ? Math.round(p.oldPriceCents / 100) : Math.round(p.priceCents / 100)}
                  platform={(p.platforms[0] || "pc") as any}
                />
              </div>
            ))}
      </HorizontalScroller>
    </section>
  );
}

function HorizontalScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({
    down: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    targetScroll: 0,
    rafPending: false,
    momentumRaf: 0,
  });

  const scheduleScroll = () => {
    if (drag.current.rafPending) return;
    drag.current.rafPending = true;
    requestAnimationFrame(() => {
      drag.current.rafPending = false;
      const el = ref.current;
      if (!el) return;
      el.scrollLeft = drag.current.targetScroll;
    });
  };

  const stopMomentum = () => {
    if (drag.current.momentumRaf) {
      cancelAnimationFrame(drag.current.momentumRaf);
      drag.current.momentumRaf = 0;
    }
  };

  const startMomentum = () => {
    const step = () => {
      const el = ref.current;
      if (!el) return;
      const v = drag.current.velocity;
      if (Math.abs(v) < 0.15) {
        drag.current.momentumRaf = 0;
        return;
      }
      drag.current.targetScroll = Math.max(
        0,
        Math.min(el.scrollWidth - el.clientWidth, drag.current.targetScroll - v)
      );
      el.scrollLeft = drag.current.targetScroll;
      drag.current.velocity *= 0.94;
      drag.current.momentumRaf = requestAnimationFrame(step);
    };
    drag.current.momentumRaf = requestAnimationFrame(step);
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    stopMomentum();
    const now = performance.now();
    drag.current = {
      ...drag.current,
      down: true,
      moved: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      lastX: e.clientX,
      lastT: now,
      velocity: 0,
      targetScroll: el.scrollLeft,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.down || !ref.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4 && !drag.current.moved) {
      drag.current.moved = true;
      try { ref.current.setPointerCapture(e.pointerId); } catch {}
    }
    if (!drag.current.moved) return;
    const now = performance.now();

    const dt = now - drag.current.lastT;
    if (dt > 0) {
      const instV = (e.clientX - drag.current.lastX) / dt * 16;
      drag.current.velocity = drag.current.velocity * 0.7 + instV * 0.3;
    }
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
    drag.current.targetScroll = drag.current.startScroll - dx;
    scheduleScroll();
  };

  const onUp = (e: React.PointerEvent) => {
    if (!drag.current.down) return;
    drag.current.down = false;
    try { ref.current?.releasePointerCapture(e.pointerId); } catch {}
    if (Math.abs(drag.current.velocity) > 0.5) startMomentum();
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClickCapture={onClickCapture}
      className="flex cursor-grab select-none gap-4 overflow-x-auto overflow-y-hidden pb-4 [scroll-behavior:auto] [scrollbar-width:thin] active:cursor-grabbing"
      style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
    >
      {children}
    </div>
  );
}

function HomeProductCard({
  id,
  variantId,
  slug,
  title,
  img,
  sale,
  regular,
  platform,
}: {
  id: string;
  variantId: string;
  slug: string;
  title: string;
  img: string;
  sale: number;
  regular: number;
  platform: any;
}) {
  const { add } = useCart();
  const { format } = useCurrency();
  const [adding, setAdding] = useState(false);
  const lockRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const numericId = Array.from(id).reduce((a, c) => a + c.charCodeAt(0), 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lockRef.current) return;
    if (!canAddToCart()) {
      toast.error("Slow down a sec — too many adds at once");
      return;
    }
    lockRef.current = true;
    setAdding(true);
    if (btnRef.current) flyToCart(btnRef.current, img);
    void add(
      { id: numericId, variantId, productId: id, name: title, platform, price: sale, old: regular, steamId: numericId, image: img },
      1,
    );
    setTimeout(() => {
      lockRef.current = false;
      setAdding(false);
    }, 800);
  };

  return (
    <Link to="/products/$id" params={{ id: slug }} className="group block content-in">
      <div className="card-tilt relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--home-line)] bg-[var(--home-panel)]">
        <img
          src={img}
          alt={`${title} cover`}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {regular > sale && (
          <span className="absolute right-3 top-3 rounded-full bg-[var(--home-accent)] px-3 py-1 text-[12px] font-bold leading-none text-black">
            -{Math.round(((regular - sale) / regular) * 100)}%
          </span>
        )}
        <button
          ref={btnRef}
          type="button"
          aria-label="Add to cart"
          onClick={handleQuickAdd}
          disabled={adding}
          aria-busy={adding}
          className="absolute bottom-3 right-3 inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-white py-1.5 pl-3 pr-3.5 text-sm font-semibold text-neutral-900 opacity-0 shadow-md transition-all hover:bg-neutral-100 disabled:cursor-not-allowed group-hover:translate-y-0 group-hover:opacity-100"
        >
          {adding ? <Loader2 size={18} className="animate-spin" /> : <img src={cartIconAsset.url} alt="" className="h-[18px] w-[18px]" />}
          <span>Add</span>
        </button>
      </div>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-medium leading-6 text-white">{title}</h3>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-base font-bold leading-6 text-white">{format(sale * 100, { rs: true })}</span>
        {regular > sale && (
          <span className="text-sm leading-5 text-white/40 line-through">{format(regular * 100, { rs: true })}</span>
        )}
      </div>
    </Link>
  );
}
