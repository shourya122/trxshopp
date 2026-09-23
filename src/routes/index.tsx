import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Clock3, Gamepad2, Headphones, Loader2, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";
import { Loader } from "@/components/Loader";
import marketHero from "@/assets/trxshop-market-hero.jpg";

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
import logo3 from "@/assets/logos/logo_2-2.svg.asset.json";
import kimiLogo from "@/assets/logos/kimi.svg.asset.json";
import copilotLogo from "@/assets/logos/copilot.svg.asset.json";
import grokLogo from "@/assets/logos/grok.png.asset.json";
import geminiLogo from "@/assets/logos/gemini.svg.asset.json";
import avatarMcp from "@/assets/mcpfp.png.asset.json";
import avatarMaster from "@/assets/masteroog.png.asset.json";
import avatarGirl from "@/assets/dp_for_girls.jpeg.asset.json";
import avatarWoody from "@/assets/woody2.png.asset.json";

import adobeLogo from "@/assets/logos/adobe.svg.asset.json";
import canvaLogo from "@/assets/logos/canva.svg.asset.json";
import primeVideoLogo from "@/assets/logos/prime-video.svg.asset.json";
import cartIconAsset from "@/assets/cart-icon-v2.svg.asset.json";
import greenCheckAsset from "@/assets/check.png.asset.json";
import redCrossAsset from "@/assets/cross.png.asset.json";
import { ImageWithSkeleton } from "@/components/ImageWithSkeleton";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { flyToCart } from "@/lib/fly-to-cart";
import { canAddToCart } from "@/lib/rate-limit";
import { toast } from "sonner";

const HERO_TAGLINES = [
  "Instant Key Delivery",
  "Best Prices Guaranteed",
  "Official Keys, Worldwide",
];

type NewProduct = { title: string; img: string; sale: number; regular: number };

const NEWLY_ADDED: NewProduct[] = [
  { title: "007 First Light PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image_6.png?v=1778582083&width=800", sale: 599, regular: 3499 },
  { title: "Forza Horizon 6 Premium Edition PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image_5.png?v=1778580602&width=800", sale: 599, regular: 9699 },
  { title: "PRAGMATA Deluxe Edition PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image_4.png?v=1776380128&width=800", sale: 599, regular: 4399 },
  { title: "Crimson Desert Deluxe Edition PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image_d05f2b22-52d2-4435-b0bc-ced8bc14b463.png?v=1773684936&width=800", sale: 599, regular: 5129 },
  { title: "DEATH STRANDING 2: ON THE BEACH PRE-ORDER PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image-1_fb902a59-20d8-47c6-9f37-41fadb246041.png?v=1773684839&width=800", sale: 599, regular: 5599 },
  { title: "Resident Evil Requiem Deluxe Edition PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image_3.png?v=1771618285&width=800", sale: 599, regular: 4799 },
  { title: "WWE 2K26 PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image-2_01780c41-c07b-4a6d-ac4e-f7a36057b171.png?v=1773684683&width=800", sale: 599, regular: 3999 },
  { title: "Nioh 3 Digital Deluxe Edition PC (Steam Account)", img: "https://digitaldownload.in/cdn/shop/files/image-2_585481df-99f2-4714-92dd-ef8d91f14d97.png?v=1771153070&width=800", sale: 599, regular: 7700 },
];

const blurSlideVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.01 } },
    exit: { transition: { staggerChildren: 0.01, staggerDirection: 1 } },
  },
  item: {
    hidden: { opacity: 0, filter: "blur(10px) brightness(0%)", y: 0 },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px) brightness(100%)",
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      y: -30,
      filter: "blur(10px) brightness(0%)",
      transition: { duration: 0.4 },
    },
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRXSHOP — Buy Cheap PC, PlayStation & Xbox Game Keys" },
      { name: "description", content: "Buy original PC, PlayStation, and Xbox game keys at the best prices. 100% genuine digital downloads with instant delivery." },
      { property: "og:title", content: "TRXSHOP — Buy Cheap PC, PlayStation & Xbox Game Keys" },
      { property: "og:description", content: "Original game keys at unbeatable prices. Instant digital delivery for PC, PlayStation, and Xbox." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trxshop.in/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TRXSHOP — Buy Cheap PC, PlayStation & Xbox Game Keys" },
      { name: "twitter:description", content: "Original game keys at unbeatable prices. Instant digital delivery for PC, PlayStation, and Xbox." },
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
          logo: "https://trxshop.xyz/favicon.ico",
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

type Filter = "all" | "pc" | "ps" | "xbox";

function HomePage() {
  const { data: fsProducts, isPending: productsPending } = useQuery({
    queryKey: ["products", "active", "home"],
    queryFn: () => listProducts({ activeOnly: true, max: 80 }),
    staleTime: 30_000,
  });

  const [pageReady, setPageReady] = useState(false);
  const [windowLoaded, setWindowLoaded] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineTrigger, setTaglineTrigger] = useState(true);

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
    if (productsPending) return;
    setImagesReady(true);
  }, [productsPending]);

  useEffect(() => {
    if (!productsPending && windowLoaded && imagesReady) setPageReady(true);
  }, [productsPending, windowLoaded, imagesReady]);

  useEffect(() => {
    const id = setInterval(() => {
      setTaglineTrigger(false);
      setTimeout(() => {
        setTaglineIdx((i) => (i + 1) % HERO_TAGLINES.length);
        setTaglineTrigger(true);
      }, 450);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const products = fsProducts || [];
  const pcProducts = products.filter((p) => (p.platforms || []).some((pl) => String(pl).toLowerCase() === "pc"));
  const psProducts = products.filter((p) => (p.platforms || []).some((pl) => String(pl).toLowerCase() === "ps"));
  const xboxProducts = products.filter((p) => (p.platforms || []).some((pl) => String(pl).toLowerCase() === "xbox"));
  const subscriptionProducts = products.filter((p) => /spotify|discord|youtube|prime|canva|adobe|chatgpt|claude|gemini|grok|perplexity|subscription/i.test(`${p.title} ${p.genre}`));
  const biggestDeals = products
    .slice()
    .sort((a, b) => (b.oldPriceCents - b.priceCents) - (a.oldPriceCents - a.priceCents))
    .slice(0, 20);

  const categories = [
    {
      label: "PC Games",
      count: pcProducts.length,
      to: "/games/steam-games",
      icon: Gamepad2,
      tone: "market-card--green",
      line: "Steam-ready titles and shared-account deals.",
    },
    {
      label: "PlayStation",
      count: psProducts.length,
      to: "/games/playstation-games",
      icon: ShieldCheck,
      tone: "market-card--blue",
      line: "Console picks with quick fulfilment.",
    },
    {
      label: "Subscriptions",
      count: subscriptionProducts.length,
      to: "/games/subscriptions",
      icon: Sparkles,
      tone: "market-card--green",
      line: "Premium apps, tools and entertainment.",
    },
    {
      label: "All Products",
      count: products.length,
      to: "/games",
      icon: BadgeCheck,
      tone: "market-card--blue",
      line: "Browse every live TRXSHOP listing.",
    },
  ] as const;

  return (
    <>
      <div
        aria-hidden={pageReady}
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ${pageReady ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{ fontFamily: "'Geist', sans-serif" }}
      >
        <div className="flex flex-col items-center gap-6">
          <Loader size={120} />
          <div className="text-white/80 text-sm tracking-widest uppercase">Loading TRX Shop</div>
        </div>
      </div>

      <section className="market-hero">
        <img
          src={marketHero}
          alt="TRXSHOP digital marketplace"
          width={1920}
          height={1080}
          className="market-hero__image"
          fetchPriority="high"
        />
        <div className="market-hero__shade" />
        <div className="market-hero__content">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="market-hero__eyebrow"
          >
            <span className="market-live-dot" />
            Premium digital marketplace
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="market-hero__title"
          >
            TRXSHOP
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="market-hero__subtitle"
          >
            Game keys, premium subscriptions and digital products delivered fast with secure payments and real support.
          </motion.p>
          <div className="market-hero__tagline" aria-live="polite">
            <span key={taglineIdx} className={taglineTrigger ? "market-tagline-in" : "market-tagline-out"}>
              {HERO_TAGLINES[taglineIdx]}
            </span>
          </div>
          <div className="market-hero__actions">
            <Link to="/games" className="market-btn market-btn--primary btn-press">
              Browse store <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/games/subscriptions" className="market-btn market-btn--secondary btn-press">
              Subscriptions <Sparkles className="h-4 w-4" />
            </Link>
          </div>
          <div className="market-hero__stats">
            {[
              ["282+", "Live products"],
              ["₹ / $", "Dual pricing"],
              ["24/7", "Support desk"],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Marquee speed={22} direction="right" className="market-logo-marquee !mt-0">
        {[
          { src: xboxLogo.url, alt: "Xbox" },
          { src: spotifyLogo.url, alt: "Spotify" },
          { src: discordLogo.url, alt: "Discord" },
          { src: chatgptLogo.url, alt: "ChatGPT" },
          { src: claudeLogo.url, alt: "Claude" },
          { src: perplexityLogo.url, alt: "Perplexity" },
          { src: deepseekLogo.url, alt: "DeepSeek" },
          { src: rockstarLogo.url, alt: "Rockstar Games" },
          { src: crunchyrollLogo.url, alt: "Crunchyroll" },
          { src: steamLogo.url, alt: "Steam" },
          { src: youtubeLogo.url, alt: "YouTube" },
          { src: geminiLogo.url, alt: "Gemini" },
          { src: copilotLogo.url, alt: "Copilot" },
          { src: grokLogo.url, alt: "Grok" },
          { src: kimiLogo.url, alt: "Kimi" },
          { src: adobeLogo.url, alt: "Adobe" },
          { src: canvaLogo.url, alt: "Canva" },
          { src: primeVideoLogo.url, alt: "Prime Video" },
          { src: logo3.url, alt: "Brand" },
        ].map((logo, i) => {
          const small = ["Canva", "Adobe", "Kimi", "Grok"].includes(logo.alt);
          const large = ["YouTube", "Steam", "Prime Video", "Crunchyroll", "DeepSeek", "Perplexity", "Discord"].includes(logo.alt);
          const sizeClass = small ? "h-8 sm:h-10" : large ? "h-16 sm:h-20" : "h-12 sm:h-14";
          return (
            <div key={i} className="market-logo-tile">
              <img
                src={logo.src}
                alt={logo.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={`w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300 select-none ${sizeClass}`}
              />
            </div>
          );
        })}
      </Marquee>

      <section className="market-section market-section--tight">
        <div className="market-section-head market-section-head--center">
          <span className="market-kicker">Choose your lane</span>
          <h2>Shop by category</h2>
          <p>Jump straight into the product type you need, then switch between rupees and dollars anytime.</p>
        </div>
        <div className="market-category-grid">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.label} to={category.to} className={`market-category-card ${category.tone}`}>
                <div className="market-category-card__top">
                  <span className="market-category-card__icon"><Icon className="h-5 w-5" /></span>
                  <span className="market-category-card__count">{productsPending ? "—" : `${category.count}+`}</span>
                </div>
                <h3>{category.label}</h3>
                <p>{category.line}</p>
                <span className="market-category-card__action">Browse <ArrowRight className="h-4 w-4" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <ProductRail
        id="games"
        kicker="Fresh stock"
        title="Newly Added"
        linkTo="/games"
        linkLabel="View all"
        products={products.slice(0, 20)}
        pending={productsPending}
      />

      <ProductRail
        id="pc-games"
        kicker="Most savings"
        title="Top PC Deals"
        linkTo="/games/steam-games"
        linkLabel="View PC games"
        products={biggestDeals}
        pending={productsPending}
      />

      <ProductRail
        id="ps-games"
        kicker="Console picks"
        title="PlayStation Games"
        linkTo="/games/playstation-games"
        linkLabel="View PlayStation"
        products={psProducts.slice(0, 20)}
        pending={productsPending}
      />

      <section id="about" className="market-section">
        <div className="market-trust-grid">
          <div className="market-trust-copy">
            <span className="market-kicker">Built for safe checkout</span>
            <h2>Why customers choose TRXSHOP</h2>
            <p>Clear pricing, fast delivery after purchase, and support that stays reachable when you need help with your digital product.</p>
            <Link to="/contactus" className="market-btn market-btn--secondary btn-press">
              Contact support <Headphones className="h-4 w-4" />
            </Link>
          </div>
          <div className="market-trust-cards">
            {[
              { icon: Zap, title: "Fast delivery", text: "Orders move quickly after payment confirmation." },
              { icon: ShieldCheck, title: "Secure payments", text: "Card, UPI and crypto flows stay protected." },
              { icon: BadgeCheck, title: "Verified catalog", text: "Products are managed from the admin panel." },
              { icon: Clock3, title: "Order tracking", text: "Customers can check their order status any time." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="market-trust-card">
                  <Icon className="h-5 w-5" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="market-final-cta">
        <div className="market-final-cta__avatars" aria-hidden="true">
          {[avatarMcp.url, avatarMaster.url, avatarGirl.url, avatarWoody.url].map((src, i) => (
            <img key={i} src={src} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20" loading="lazy" />
          ))}
        </div>
        <div className="market-final-cta__stars" aria-label="Five star rating">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
        </div>
        <h2>Ready to find your next digital product?</h2>
        <p>Browse the live catalog, add your product to cart, and pay securely in rupees while viewing prices in dollars whenever you want.</p>
        <Link to="/games" className="market-btn market-btn--primary btn-press">
          Shop now <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}

function ProductRail({
  id,
  kicker,
  title,
  linkTo,
  linkLabel,
  products,
  pending,
}: {
  id: string;
  kicker: string;
  title: string;
  linkTo: "/games" | "/games/steam-games" | "/games/playstation-games";
  linkLabel: string;
  products: NonNullable<Awaited<ReturnType<typeof listProducts>>>;
  pending: boolean;
}) {
  return (
    <section id={id} className="market-section market-product-rail">
      <div className="market-section-head">
        <div>
          <span className="market-kicker">{kicker}</span>
          <h2>{title}</h2>
        </div>
        <Link to={linkTo} className="market-view-link">
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <HorizontalScroller>
        {pending && products.length === 0
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={`sk-${id}-${i}`} className="shrink-0 w-[58vw] sm:w-[31vw] lg:w-[21vw] xl:w-[18vw]">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p) => {
              const sale = Math.round(p.priceCents / 100);
              const regular = p.oldPriceCents > 0 ? Math.round(p.oldPriceCents / 100) : sale;
              const img = p.coverImage || p.screenshots[0] || "";
              return (
                <div key={p.id} className="shrink-0 w-[58vw] sm:w-[31vw] lg:w-[21vw] xl:w-[18vw]">
                  <HomeProductCard
                    id={p.id}
                    variantId={p.variantId}
                    slug={p.slug || p.id}
                    title={p.title}
                    img={img}
                    sale={sale}
                    regular={regular}
                    platform={(p.platforms[0] || "pc") as any}
                  />
                </div>
              );
            })}
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
    // Let native scrolling handle touch/pen — JS drag causes stutter on mobile
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
    // NOTE: don't capture the pointer here — capturing retargets the click
    // event to this container and product links stop working. Capture only
    // once an actual drag starts (see onMove).

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
      className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 cursor-grab active:cursor-grabbing select-none [scrollbar-width:thin] [scroll-behavior:auto]"
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
      <div className="relative overflow-hidden bg-neutral-900 aspect-[3/4] rounded-sm card-tilt">
        <img
          src={img}
          alt={`${title} game cover`}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full"
          style={{ fontSize: "12px", fontWeight: 700, lineHeight: 1 }}
        >
          Sale
        </span>
        <button
          ref={btnRef}
          type="button"
          aria-label="Add to cart"
          onClick={handleQuickAdd}
          disabled={adding}
          aria-busy={adding}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white text-neutral-900 rounded-full pl-3 pr-3.5 py-1.5 text-sm font-semibold shadow-md border border-neutral-200 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-neutral-100 disabled:cursor-not-allowed"
        >
          {adding ? <Loader2 size={18} className="animate-spin" /> : <img src={cartIconAsset.url} alt="" className="w-[18px] h-[18px]" />}
          <span>Add</span>
        </button>
      </div>
      <h3
        className="mt-3 text-white line-clamp-2"
        style={{ fontSize: "16px", fontWeight: 500, lineHeight: "24px", letterSpacing: 0 }}
      >
        {title}
      </h3>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-white" style={{ fontSize: "16px", fontWeight: 700, lineHeight: "24px" }}>
          {format(sale * 100, { rs: true })}
        </span>
        {regular > sale && (
          <span className="text-neutral-500 line-through" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
            {format(regular * 100, { rs: true })}
          </span>
        )}
      </div>
    </Link>
  );
}
