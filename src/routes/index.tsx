import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { TextEffect } from "@/components/ui/text-effect";
import { BlurFade } from "@/components/ui/blur-fade";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, BadgeCheck, Gamepad2, Flame, Check, X, Loader2 } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Loader } from "@/components/Loader";

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
      { property: "og:url", content: "https://trxshop.xyz/" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TRXSHOP",
          url: "https://trxshop.xyz/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://trxshop.xyz/games?q={search_term_string}",
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
          url: "https://trxshop.xyz/",
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
  const { add } = useCart();
  const { data: fsProducts, isPending: productsPending } = useQuery({
    queryKey: ["products", "active", "home"],
    queryFn: () => listProducts({ activeOnly: true, max: 400 }),
    staleTime: 30_000,
  });

  // Full-page loader: wait until products + their images + window.load are ready
  const [pageReady, setPageReady] = useState(false);
  const [windowLoaded, setWindowLoaded] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);

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
    // Don't gate first paint on preloading 18 remote images. Mark ready once
    // products query resolves; the loader overlay then needs only window.load.
    if (productsPending) return;
    setImagesReady(true);
  }, [productsPending, fsProducts]);


  useEffect(() => {
    if (!productsPending && windowLoaded && imagesReady) {
      setPageReady(true);
    }
  }, [productsPending, windowLoaded, imagesReady]);


  // rotating hero tagline (TextEffect with exit)
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineTrigger, setTaglineTrigger] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setTaglineTrigger(false);
      setTimeout(() => {
        setTaglineIdx((i) => (i + 1) % HERO_TAGLINES.length);
        setTaglineTrigger(true);
      }, 500);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // Unicorn Studio animated background — enabled on all devices.
  // Lag is prevented via: lazy-load on idle (never blocks first paint),
  // pause when scrolled offscreen, pause when tab hidden, and respect
  // prefers-reduced-motion for accessibility.
  const heroBgRef = useRef<HTMLDivElement | null>(null);
  const [enableHeroBg, setEnableHeroBg] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return; // a11y: honor reduced motion
    // Skip the WebGL canvas on phones — it dominates GPU time on mid-range Android.
    if (window.matchMedia("(max-width: 767px)").matches) return;
    setEnableHeroBg(true);
  }, []);



  useEffect(() => {
    if (!enableHeroBg || typeof window === "undefined") return;
    const el = heroBgRef.current;
    if (!el) return;
    let started = false;
    let cleanup: (() => void) | undefined;
    const start = () => {
      if (started) return;
      started = true;
      const init = () => {
        try { (window as any).UnicornStudio?.init?.(); } catch {}
      };
      if ((window as any).UnicornStudio) {
        init();
      } else {
        const existing = document.querySelector<HTMLScriptElement>("script[data-unicorn]");
        if (existing) {
          existing.addEventListener("load", init, { once: true });
        } else {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
          script.async = true;
          script.dataset.unicorn = "1";
          script.onload = init;
          document.head.appendChild(script);
        }
      }
      // Pause the canvas when scrolled offscreen
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          el.style.visibility = e.isIntersecting ? "visible" : "hidden";
        }
      }, { threshold: 0 });
      io.observe(el);
      const onVis = () => {
        el.style.visibility = document.hidden ? "hidden" : "visible";
      };
      document.addEventListener("visibilitychange", onVis);
      cleanup = () => {
        io.disconnect();
        document.removeEventListener("visibilitychange", onVis);
      };
    };
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    const handle = idle ? idle(start, { timeout: 1500 }) : window.setTimeout(start, 600);
    return () => {
      if (idle && typeof handle === "number") {
        (window as any).cancelIdleCallback?.(handle);
      } else {
        clearTimeout(handle as unknown as number);
      }
      cleanup?.();
    };
  }, [enableHeroBg]);

  return (
    <>
      {/* Full-page loader until products + images + window.load are ready */}
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

      <section className="hero">
        <AmbientBackground />



        
        <div className="hero-left">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
          >
            <span className="gradient-text">Every Platform.</span>
            <br />
            <span className="gradient-text">One Store.</span>
            <br />
            <span className="bg-[linear-gradient(110deg,#7ec8ff_10%,#fff_45%,#a78bfa_90%)] bg-clip-text text-transparent">
              Fast delivery.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-3 max-w-xl text-pretty text-sm text-white/65 sm:text-base sm:mt-4"
          >
            Buy Original PC, PlayStation, and Xbox games at unbeatable prices — The software and subscriptions you actually use. 100% genuine Digital Download
          </motion.p>
          <div className="hero-pf fu d3 mt-6">
            <div className="pb pb-pc">PC / Steam</div>
            <div className="pb pb-ps">PlayStation</div>
            <div className="pb pb-xb">Xbox</div>
          </div>
          <div className="hero-actions fu d4">
            <style>{`
              @keyframes beam-spin { to { transform: rotate(360deg); } }
              @keyframes dots-move { 0% { background-position: 0 0; } 100% { background-position: 24px 24px; } }
              @media (max-width: 767px) {
                /* Pause hero infinite animations on phones — GPU/CPU savings. */
                .hero-cta-beam, .hero-cta-dots { animation: none !important; }
                .hero-cta-beam { background: #1D9BF0 !important; }
              }
            `}</style>

            <Link to="/games" className="group inline-flex overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] rounded-full pt-[1px] pr-[1px] pb-[1px] pl-[1px] relative items-center justify-center">
              {/* Spinning Border Beam (Visible on Hover) */}
              <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ffffff_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
              {/* Default Static Border */}
              <span className="absolute inset-0 rounded-full bg-zinc-800 transition-opacity duration-300 group-hover:opacity-0"></span>
              {/* 3D Button Surface & Content */}
              <span className="flex items-center justify-center gap-2.5 uppercase transition-colors duration-300 group-hover:text-white text-sm font-medium text-zinc-400 tracking-widest bg-gradient-to-b from-zinc-800 to-zinc-950 w-full h-full rounded-full pt-3.5 pr-8 pb-3.5 pl-8 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <span className="relative z-10">SHOP ALL PRODUCTS</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <Marquee speed={20} direction="right" className="!mt-0">
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
          const sizeClass = small
            ? "h-8 sm:h-10"
            : large
            ? "h-16 sm:h-20"
            : "h-12 sm:h-14";
          return (
            <div key={i} className="flex items-center px-8 shrink-0">
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

      {/* NEWLY ADDED — digitaldownload.in style */}
      <section
        id="games"
        className="px-4 sm:px-8 lg:px-16 py-12 lg:py-16 bg-black text-white"
        style={{ fontFamily: "Inter, Avenir, 'Helvetica Neue', Helvetica, sans-serif" }}
      >
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            Newly Added
          </h2>
          <Link
            to="/games"
            className="text-sm font-medium text-neutral-300 underline underline-offset-4 hover:text-white"
          >
            View all newly added games
          </Link>
        </div>
        <HorizontalScroller>
          {productsPending && !fsProducts
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={`sk-${i}`} className="shrink-0 w-[42vw] sm:w-[28vw] lg:w-[21vw]">
                  <ProductCardSkeleton />
                </div>
              ))
            : (fsProducts || []).slice(0, 20).map((p) => {
                const sale = Math.round(p.priceCents / 100);
                const regular = p.oldPriceCents > 0 ? Math.round(p.oldPriceCents / 100) : sale;
                const img = p.coverImage || p.screenshots[0] || "";
                return (
                  <div key={p.id} className="shrink-0 w-[42vw] sm:w-[28vw] lg:w-[21vw]">
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

      {/* PC GAMES */}
      <section
        id="pc-games"
        className="px-4 sm:px-8 lg:px-16 py-12 lg:py-16 bg-black text-white"
        style={{ fontFamily: "Inter, Avenir, 'Helvetica Neue', Helvetica, sans-serif" }}
      >
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Geist', sans-serif" }}>
            PC Games
          </h2>
          <Link
            to="/games/steam-games"
            className="text-sm font-medium text-neutral-300 underline underline-offset-4 hover:text-white"
          >
            View all PC games
          </Link>
        </div>
        <HorizontalScroller>
          {productsPending && !fsProducts
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={`sk-pc-${i}`} className="shrink-0 w-[42vw] sm:w-[28vw] lg:w-[21vw]">
                  <ProductCardSkeleton />
                </div>
              ))
            : (fsProducts || [])
                .filter((p) => {
                  const cat = (p.category || "").trim().toLowerCase();
                  if (cat) return cat === "pc";
                  return (p.platforms || []).some((pl) => String(pl).toLowerCase() === "pc");
                })
                .slice()
                .sort((a, b) => (b.oldPriceCents - b.priceCents) - (a.oldPriceCents - a.priceCents))
                .slice(0, 20)

                .map((p) => {
                  const sale = Math.round(p.priceCents / 100);
                  const regular = p.oldPriceCents > 0 ? Math.round(p.oldPriceCents / 100) : sale;
                  const img = p.coverImage || p.screenshots[0] || "";
                  return (
                    <div key={p.id} className="shrink-0 w-[42vw] sm:w-[28vw] lg:w-[21vw]">
                      <HomeProductCard
                        id={p.id}
                        variantId={p.variantId}
                        slug={p.slug || p.id}
                        title={p.title}
                        img={img}
                        sale={sale}
                        regular={regular}
                        platform="pc"
                      />
                    </div>
                  );
                })}
        </HorizontalScroller>
      </section>

      {/* PS GAMES */}
      <section
        id="ps-games"
        className="px-4 sm:px-8 lg:px-16 py-12 lg:py-16 bg-black text-white"
        style={{ fontFamily: "Inter, Avenir, 'Helvetica Neue', Helvetica, sans-serif" }}
      >
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Geist', sans-serif" }}>
            PlayStation Games

          </h2>
          <Link
            to="/games/playstation-games"
            className="text-sm font-medium text-neutral-300 underline underline-offset-4 hover:text-white"
          >
            View all PS games
          </Link>
        </div>
        <HorizontalScroller>
          {productsPending && !fsProducts
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={`sk-ps-${i}`} className="shrink-0 w-[42vw] sm:w-[28vw] lg:w-[21vw]">
                  <ProductCardSkeleton />
                </div>
              ))
            : (fsProducts || [])
                .filter((p) => {
                  const cat = (p.category || "").trim().toLowerCase();
                  if (cat) return cat === "ps";
                  return (p.platforms || []).some((pl) => String(pl).toLowerCase() === "ps");
                })
                .slice(0, 20)
                .map((p) => {
                  const sale = Math.round(p.priceCents / 100);
                  const regular = p.oldPriceCents > 0 ? Math.round(p.oldPriceCents / 100) : sale;
                  const img = p.coverImage || p.screenshots[0] || "";
                  return (
                    <div key={p.id} className="shrink-0 w-[42vw] sm:w-[28vw] lg:w-[21vw]">
                      <HomeProductCard
                        id={p.id}
                        variantId={p.variantId}
                        slug={p.slug || p.id}
                        title={p.title}
                        img={img}
                        sale={sale}
                        regular={regular}
                        platform="ps"
                      />
                    </div>
                  );
                })}
        </HorizontalScroller>
      </section>



      {/* WHY GAMERS TRUST US — digitaldownload.in style */}
      <section
        id="about"
        className="px-4 sm:px-8 lg:px-16 py-12 lg:py-20 bg-black text-white"
        style={{ fontFamily: "Inter, Avenir, 'Helvetica Neue', Helvetica, sans-serif" }}
      >
        <h2 className="text-center font-bold tracking-tight text-white mb-8 sm:mb-12" style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.2 }}>
          Why Gamers Trust Us?
        </h2>
        <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.04]">
                <th className="text-left p-4 sm:p-5 font-semibold text-white" style={{ fontSize: "16px" }}>Features</th>
                <th className="text-center p-4 sm:p-5 font-semibold text-white" style={{ fontSize: "16px" }}>TRX Shop</th>
                <th className="text-center p-4 sm:p-5 font-semibold text-neutral-400" style={{ fontSize: "16px" }}>Other Stores</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Fast Delivery After Purchase",
                "Genuine & Verified Products",
                "Fair Pricing",
                "Customer Support",
              ].map((feature) => (
                <tr key={feature} className="border-t border-white/10">
                  <td className="p-4 sm:p-5 text-white" style={{ fontSize: "15px", fontWeight: 500 }}>{feature}</td>
                  <td className="p-4 sm:p-5 text-center">
                    <img src={greenCheckAsset.url} alt="Yes" className="inline-block w-6 h-6 transition-transform duration-200 hover:scale-125" />
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <img src={redCrossAsset.url} alt="No" className="inline-block w-6 h-6 transition-transform duration-200 hover:scale-125" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="relative z-10 max-w-4xl sm:pt-20 md:pt-28 text-center mr-auto ml-auto pt-14 pb-12">

        {/* Social proof */}

        <div className="mb-6 flex items-center justify-center gap-4">

          <div className="flex -space-x-3">

            <img src={avatarMcp.url} alt="Client 1" className="h-9 w-9 rounded-full ring-2 ring-white/20 object-cover" />

            <img src={avatarMaster.url} alt="Client 2" className="h-9 w-9 rounded-full ring-2 ring-white/20 object-cover" />

            <img src={avatarGirl.url} alt="Client 3" className="h-9 w-9 rounded-full ring-2 ring-white/20 object-cover" />

            <img src={avatarWoody.url} alt="Client 4" className="h-9 w-9 rounded-full ring-2 ring-white/20 object-cover" />



          </div>

          <div className="flex flex-col items-start">

            <div className="flex items-center">

              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 fill-white"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>

              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 fill-white"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>

              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 fill-white"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>

              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 fill-white"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>

              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 fill-white"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>

            </div>

            <p className="mt-1 text-xs font-medium text-white/70">100+&nbsp;</p>

          </div>

        </div>

        <h2 className="max-w-5xl sm:text-5xl md:text-7xl text-4xl tracking-tighter mr-auto ml-auto">
          Ready to
          <span className="font-display-italic text-white tracking-tight">&nbsp;find&nbsp;</span>
          your next&nbsp;
          <br />
          Digital Product
        </h2>

        <p className="max-w-2xl sm:text-lg text-base font-normal text-white/70 mt-6 mr-auto ml-auto">
          Buy Original PC, PlayStation, and Xbox games at best prices — The software and subscriptions you actually use. 100% genuine Digital Download
        </p>

        <div className="flex flex-col gap-3 sm:flex-row mt-8 items-center justify-center">

          <Link to="/games" className="group inline-flex overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] rounded-full pt-[1px] pr-[1px] pb-[1px] pl-[1px] relative items-center justify-center">

            {/* Spinning Border Beam (Visible on Hover) */}

            <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ffffff_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>

            {/* Default Static Border */}

            <span className="absolute inset-0 rounded-full bg-zinc-800 transition-opacity duration-300 group-hover:opacity-0"></span>

            {/* 3D Button Surface & Content */}

            <span className="flex items-center justify-center gap-2 uppercase transition-colors duration-300 group-hover:text-white text-xs font-medium text-zinc-400 tracking-widest bg-gradient-to-b from-zinc-800 to-zinc-950 w-full h-full rounded-full pt-2.5 pr-6 pb-2.5 pl-6 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">

              <span className="relative z-10">SHOP NOW</span>

              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">

                <path d="M5 12h14"></path>

                <path d="m12 5 7 7-7 7"></path>

              </svg>

            </span>

          </Link>

        </div>

        {/* Glow plate */}

      </section>

    </>
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
  hasOptions?: boolean;
}) {
  const { add } = useCart();
  const { format } = useCurrency();
  const [adding, setAdding] = useState(false);
  const lockRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const numericId = Array.from(id).reduce((a, c) => a + c.charCodeAt(0), 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    // Products with editions/options must be configured on the product page —
    // let the surrounding link navigate there instead of adding directly.
    if (hasOptions) return;
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
