import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck, Layers, Clock, Lock, Check, Star, ArrowRight, Eye, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import cartIconAsset from "@/assets/cart-icon-v2.svg.asset.json";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { getProduct, getProductBySlug, listProducts } from "@/lib/products";
import type { Product } from "@/lib/types";

import { useCart } from "@/lib/cart";
import { ImageWithSkeleton } from "@/components/ImageWithSkeleton";
import gpayLogo from "@/assets/gpay_new.png";
import paytmLogo from "@/assets/paytm.svg";
import mastercardAsset from "@/assets/mastercard.svg.asset.json";
import avatar1 from "@/assets/mcpfp.png.asset.json";
import avatar2 from "@/assets/masteroog.png.asset.json";
import avatar3 from "@/assets/woody.png.asset.json";
import { toast } from "sonner";
import { PayWithCryptoButton } from "@/components/PayWithCryptoButton";



const productQueryOptions = (idOrSlug: string) => ({
  queryKey: ["product-by-slug", idOrSlug] as const,
  // `getProduct` already resolves by uuid OR slug — no need for a second round-trip.
  queryFn: () => getProduct(idOrSlug),
  staleTime: 60_000,
});

export const Route = createFileRoute("/products/$id")({
  head: ({ params, loaderData }) => {
    const product = loaderData as Awaited<ReturnType<typeof getProduct>> | undefined;
    const url = `https://trxshop.xyz/products/${params.id}`;
    if (!product) {
      return {
        meta: [
          { title: "Game — TRXSHOP" },
          { property: "og:url", content: url },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const price = Math.round(product.priceCents / 100);
    const platforms = (product.platforms || []).join(", ").toUpperCase() || "PC";
    const title = `Buy ${product.title} (${platforms}) — ₹${price} | TRXSHOP`;
    const desc = (product.description || `Buy ${product.title} for ${platforms}. Genuine digital key, instant delivery on TRXSHOP.`).slice(0, 155);
    const image = product.coverImage || "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.description || "",
            image: image ? [image, ...(product.screenshots || [])] : undefined,
            sku: product.id,
            brand: { "@type": "Brand", name: product.publisher || product.developer || "TRXSHOP" },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "INR",
              price: price.toString(),
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://trxshop.xyz/" },
              { "@type": "ListItem", position: 2, name: "Games", item: "https://trxshop.xyz/games" },
              { "@type": "ListItem", position: 3, name: product.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(productQueryOptions(params.id)),
  component: ProductPage,
});

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(left / 3600)).padStart(2, "0");
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function ProductPage() {
  const { id } = Route.useParams();
  
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [cartState, setCartState] = useState<"idle" | "loading" | "added">("idle");
  const [buyingNow, setBuyingNow] = useState(false);

  const { data: product } = useSuspenseQuery(productQueryOptions(id));

  const editions = product?.editions ?? [];
  const hasEditions = editions.length > 0;
  const [selectedEdition, setSelectedEdition] = useState<string>(editions[0]?.name ?? "");
  useEffect(() => {
    if (hasEditions && !editions.find((e) => e.name === selectedEdition)) {
      setSelectedEdition(editions[0].name);
    }
    if (!hasEditions && selectedEdition) setSelectedEdition("");
  }, [hasEditions, editions, selectedEdition]);

  const optionGroups = useMemo(() => product?.optionGroups ?? [], [product]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  useEffect(() => {
    setSelectedOptions((cur) => {
      const next: Record<string, string> = {};
      for (const g of optionGroups) {
        next[g.name] = g.values.includes(cur[g.name]) ? cur[g.name] : g.values[0];
      }
      const same =
        Object.keys(next).length === Object.keys(cur).length &&
        Object.keys(next).every((k) => next[k] === cur[k]);
      return same ? cur : next;
    });
  }, [optionGroups]);

  const { data: allProducts } = useQuery({
    queryKey: ["products", "active"],
    queryFn: () => listProducts({ activeOnly: true, max: 12 }),
    staleTime: 60_000,
  });

  const timer = useCountdown(3600);

  if (!product) {
    return (
      <div className="bg-black text-white min-h-dvh flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/" className="text-emerald-400 underline">Back to home</Link>
      </div>
    );
  }

  const activeEdition = hasEditions
    ? editions.find((e) => e.name === selectedEdition) ?? editions[0]
    : null;
  const effectiveCents = activeEdition ? activeEdition.priceCents : product.priceCents;
  const sale = Math.round(effectiveCents / 100);
  const regular = product.oldPriceCents > 0 ? Math.round(product.oldPriceCents / 100) : sale;
  const related = (allProducts || []).filter((p) => p.id !== product.id).slice(0, 4);
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;

  const numericId = Array.from(product.id).reduce((a, c) => a + c.charCodeAt(0), 0);
  const handleAddToCart = async () => {
    if (cartState !== "idle" || outOfStock) return;
    try {
      await add({
        id: numericId,
        variantId: product.variantId,
        productId: product.id,
        name: product.title,
        platform: (product.platforms[0] || "pc"),
        price: sale,
        old: regular,
        steamId: numericId,
        image: product.coverImage || product.screenshots[0] || "",
        edition: activeEdition ? { name: activeEdition.name, priceCents: activeEdition.priceCents } : undefined,
        options: optionGroups.length ? selectedOptions : undefined,
      }, qty);
      setCartState("added");
      setTimeout(() => setCartState("idle"), 1200);
    } catch (e) {
      setCartState("idle");
      toast.error((e as Error)?.message || "Couldn't add to cart. Please try again.");
    }
  };

  const navigate = useNavigate();
  const handleBuyNow = async () => {
    if (outOfStock || buyingNow) return;
    setBuyingNow(true);
    try {
      const buyNowItem = {
        id: numericId,
        variantId: product.variantId,
        productId: product.id,
        lineId: null,
        name: product.title,
        platform: (product.platforms[0] || "pc"),
        price: sale,
        old: regular,
        steamId: numericId,
        image: product.coverImage || product.screenshots[0] || "",
        qty: 1,
        edition: activeEdition
          ? { name: activeEdition.name, priceCents: activeEdition.priceCents }
          : undefined,
        options: optionGroups.length ? selectedOptions : undefined,
      };
      try {
        sessionStorage.setItem(
          "trxshop_buy_now",
          JSON.stringify({ items: [buyNowItem], ts: Date.now() }),
        );
      } catch {}
      await navigate({ to: "/checkout", search: { buyNow: 1 } });
    } catch (e) {
      toast.error((e as Error)?.message || "Couldn't start checkout. Please try again.");
    } finally {
      setBuyingNow(false);
    }
  };

  const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}.00`;
  const productTitle = product.title;
  const coverSrc = product.coverImage || product.screenshots[0] || "";

  return (
    <div className="bg-black text-white font-['Poppins',sans-serif] min-h-dvh">
      {/* Main grid */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-24 pb-6 grid grid-cols-1 lg:grid-cols-[480px_minmax(0,1fr)] gap-12 lg:gap-20">
        {/* Image */}
        <div className="lg:sticky lg:top-6 self-start w-full">
          <div className="rounded-lg overflow-hidden bg-neutral-900 aspect-[3/4]">
            <ImageWithSkeleton
              src={coverSrc}
              alt={productTitle}
              className="w-full h-full object-contain object-center p-3"
              style={{ imageRendering: "auto" }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="lg:pl-8">
          <div className="inline-flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-full pl-2 pr-5 py-1.5 mb-4">
            <div className="flex -space-x-2">
              {[avatar1.url, avatar2.url, avatar3.url].map((src, i) => (
                <img key={i} src={src} alt="" className="w-7 h-7 rounded-full border-2 border-neutral-900 object-cover" />
              ))}
            </div>
            <span className="text-[11px] font-semibold tracking-wider text-neutral-200">100 + HAPPY CUSTOMERS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white mb-3">{productTitle}</h1>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold text-white">{fmt(sale)}</span>
            <span className="text-2xl font-bold text-neutral-400 line-through">{fmt(regular)}</span>
          </div>

          {/* Reviews pill */}
          <div className="inline-flex items-center gap-2 border-2 border-dashed border-emerald-500/60 rounded-md px-3 py-1.5 mb-5">
            <span className="text-[11px] font-extrabold tracking-wider text-emerald-700">EXCELLENT</span>
            <span className="flex items-center gap-0.5 text-emerald-600">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor" strokeWidth={0} />)}
            </span>
            <span className="text-[11px] text-neutral-200">rated <b>{product.rating}/5</b> on</span>
            <Star size={13} className="text-emerald-600" fill="currentColor" strokeWidth={0} />
            <span className="text-[11px] font-extrabold tracking-wider text-emerald-700">REVIEWS</span>
          </div>

          {/* Sale promo box */}
          <div className="border-2 border-dashed border-neutral-700 rounded-xl px-4 py-4 sm:px-6 sm:py-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1.5 sm:mb-2 leading-tight">🚀 Grand Opening</h2>
                <p className="text-xs sm:text-[13px] font-semibold text-neutral-200 leading-snug">
                  Extra 20% OFF on ₹299+ orders Use code <b>"HELLOTRX"</b> Applicable on PC Games Only
                </p>
              </div>
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold rounded-full px-4 sm:px-5 py-2 sm:py-2.5 whitespace-nowrap shrink-0 text-center font-mono self-start sm:self-auto" style={{ fontVariantNumeric: "tabular-nums" }}>
                Time left: {timer}
              </div>
            </div>
          </div>

          {/* Edition selector (only if editions defined) */}
          {hasEditions && (
            <div className="mb-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 mb-2">Edition</div>
              <div className="flex flex-wrap gap-2">
                {editions.map((e) => {
                  const on = e.name === selectedEdition;
                  return (
                    <button
                      key={e.name}
                      type="button"
                      onClick={() => setSelectedEdition(e.name)}
                      className={`px-4 py-2.5 rounded-lg border text-[13px] font-semibold transition ${
                        on
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      <div className="text-left">
                        <div>{e.name}</div>
                        <div className={`text-[11px] font-normal ${on ? "text-emerald-300" : "text-neutral-400"}`}>
                          ₹{(e.priceCents / 100).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant options (admin-defined, per product) */}
          {optionGroups.length > 0 && (
            <div className="mb-5 space-y-4">
              {optionGroups.map((g) => (
                <div key={g.name}>
                  <div className="text-[13px] font-medium text-neutral-300 mb-2">{g.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {g.values.map((v) => {
                      const on = selectedOptions[g.name] === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedOptions((cur) => ({ ...cur, [g.name]: v }))}
                          className="relative isolate min-w-[150px] rounded-full border border-neutral-700 px-5 py-3 text-[13.5px] font-semibold transition-colors duration-300"
                        >
                          {on && (
                            <motion.span
                              layoutId={`trx-opt-${g.name}`}
                              transition={{ type: "spring", stiffness: 380, damping: 32 }}
                              className="absolute inset-0 -z-10 rounded-full bg-white"
                            />
                          )}
                          <span className={on ? "text-black" : "text-neutral-300"}>{v}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Qty + Add to cart */}
          <div className="flex items-stretch gap-3 mb-3 h-14">
            <div className="flex items-center border border-neutral-700 rounded-lg overflow-hidden h-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-full text-lg hover:bg-neutral-900">−</button>
              <div className="w-10 text-center font-semibold">{qty}</div>
              <button onClick={() => setQty(qty + 1)} className="w-11 h-full text-lg hover:bg-neutral-900">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={cartState !== "idle" || outOfStock}
              className={`flex-1 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-base relative overflow-hidden ${
                outOfStock
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : cartState === "added"
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-black hover:bg-neutral-200"
              } ${cartState === "loading" ? "scale-[0.98]" : ""}`}
            >
              <span
                key={cartState}
                className="flex items-center justify-center gap-2 animate-[atc-pop_0.3s_ease-out]"
              >
                {outOfStock ? (<>Out of stock</>) : (
                  <>
                    {cartState === "idle" && (<><img src={cartIconAsset.url} alt="" className="w-[35px] h-[35px]" /> Add to cart</>)}
                    {cartState === "loading" && (<><Loader2 size={18} className="animate-spin" /> Adding…</>)}
                    {cartState === "added" && (<><Check size={20} strokeWidth={3} /> Added!</>)}
                  </>
                )}
              </span>
            </button>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock || buyingNow}
            className={`w-full font-semibold py-4 rounded-lg transition mb-3 text-base inline-flex items-center justify-center gap-2 ${outOfStock ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" : "bg-white text-black hover:bg-neutral-200"}`}
          >
            {buyingNow && !outOfStock && <Loader2 size={18} className="animate-spin" />}
            {outOfStock ? "Currently unavailable" : "Buy it now"}
          </button>
          <div className="mb-6">
            <PayWithCryptoButton
              disabled={outOfStock}
              amount={sale * qty}
              items={[{ name: product.title, qty, price: sale, variantId: product.variantId }]}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-lg text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>


          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Layers, t: "Instant Access", s: "Instant email Delivery" },
              { icon: Clock, t: "Instant Help 24×7", s: "Always Here to Help" },
              { icon: Lock, t: "Safe Payments", s: "100% Secure Payment" },
            ].map(({ icon: Ic, t, s }) => (
              <div key={t} className="px-2 py-3 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                  <Ic size={20} className="text-emerald-400" strokeWidth={2} />
                </div>
                <div className="text-[15px] font-extrabold text-white mb-2 leading-tight">{t}</div>
                <div className="text-[12px] text-neutral-400 font-bold leading-tight">{s}</div>
              </div>
            ))}
          </div>

          {/* Payments strip */}
          <div className="flex items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4 md:gap-x-5 flex-wrap mb-6 py-2">
            {[
              { name: "UPI", src: "https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg", h: "h-4 sm:h-5" },
              { name: "Paytm", src: paytmLogo, h: "h-5 sm:h-6" },
              { name: "Google Pay", src: gpayLogo, h: "h-8 sm:h-9" },
              { name: "Mastercard", src: mastercardAsset.url, h: "h-6 sm:h-7" },
              { name: "Litecoin", src: "https://cdn.simpleicons.org/litecoin/345D9D", h: "h-6 sm:h-7" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-center shrink-0">
                <img src={p.src} alt={p.name} className={`${p.h} w-auto object-contain`} />
              </div>
            ))}
          </div>


          {/* Replacement guarantee */}
          <div className="border-2 border-dashed border-emerald-500/40 rounded-xl p-5 flex items-start gap-5 mb-2">
            <div className="flex flex-col items-center flex-shrink-0 w-20">
              <ShieldCheck size={48} className="text-emerald-500" strokeWidth={1.5} />
              <div className="text-[10px] font-extrabold tracking-[0.18em] text-emerald-500 mt-1">GUARANTEE</div>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-extrabold text-white mb-2">100% Replacement Guarantee</div>
              <p className="text-[13px] text-neutral-300 leading-relaxed font-medium">
                We trust our team and delivery system completely. If your game isn't delivered within 48 hours or you encounter any problem with it,
                we'll provide a replacement at no cost — forever
              </p>
            </div>
          </div>

          {/* Description + Terms accordions (right column) */}
          <Accordion type="multiple" className="w-full mt-4">
            <AccordionItem value="desc" className="border-b border-neutral-800">
              <AccordionTrigger className="text-[15px] font-bold text-white py-5 hover:no-underline">
                <span className="flex items-center gap-2"><Eye size={18} /> Description</span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-200 leading-relaxed mb-5 whitespace-pre-line">{product.description || `Play ${product.title} — instant Steam account delivery.`}</p>
                <h3 className="text-sm font-bold mb-3 text-white">Product Details:</h3>
                <ol className="space-y-3 text-sm text-neutral-200 list-decimal pl-5 marker:font-bold marker:text-white">
                  {[
                    "You will receive access to a Steam account, available for offline mode only.",
                    "The provided account is intended strictly for offline gameplay; online services are not accessible.",
                    "This is a licensed and authentic version of the game.",
                    "The account is valid globally, allowing access from any region.",
                    "You can fully enjoy the single-player experience.",
                    `Languages supported: ${product.languages}.`,
                    "Updates and patches can be downloaded independently.",
                    "Always includes the latest available version of the game.",
                    "Login support provided in case of any issues.",
                  ].map((line) => (
                    <li key={line} className="font-semibold leading-snug">{line}</li>
                  ))}
                </ol>
                <h3 className="text-sm font-bold mt-6 mb-3 text-white">Terms &amp; Conditions:</h3>
                <ul className="space-y-2 text-sm text-neutral-200 list-disc pl-5">
                  <li>This product does not include a digital activation key; access is granted through a Steam account containing the purchased game.</li>
                  <li>Account activation is completed without using any third-party software.</li>
                  <li>The account remains the property of the original owner. Changing security settings is strictly prohibited.</li>
                  <li>Sharing or transferring the account to others is not allowed.</li>
                  <li>No refunds after purchase. If the account is non-operational, a replacement will be issued.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews */}
      <ReviewsCarousel />

      {/* Related */}
      {/* Related — "You may also like" carousel */}
      <RelatedCarousel related={related} />
    </div>
  );
}

function RelatedCarousel({ related }: { related: Product[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const w = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  if (related.length === 0) return null;

  return (
    <section className="text-2xl sm:text-3xl font-bold mb-6 text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6" style={{ fontFamily: "'Giena', sans-serif" }}>You may also like</h2>
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {related.map((g) => {
              const sale = Math.round(g.priceCents / 100);
              const regular = g.oldPriceCents > 0 ? Math.round(g.oldPriceCents / 100) : sale;
              const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}.00`;
              return (
                <Link
                  key={g.id}
                  to="/products/$id"
                  params={{ id: g.slug || g.id }}
                  data-card
                  className="group snap-start shrink-0 basis-[calc((100%-3rem)/2)] sm:basis-[calc((100%-4.5rem)/3)] lg:basis-[calc((100%-4.5rem)/4)]"
                >
                  <div className="relative overflow-hidden bg-neutral-900 rounded-lg aspect-[3/4] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]">
                    <ImageWithSkeleton
                      src={g.coverImage || g.screenshots[0] || ""}
                      alt={`${g.title} game cover`}
                      loading="lazy"
                      className="w-full h-full object-contain object-center p-1.5 will-change-transform transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      skeletonClassName="bg-neutral-800"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />


                    <span className="absolute top-3 right-3 bg-white text-neutral-900 text-xs font-semibold rounded-full px-3 py-1 shadow-sm">
                      Sale
                    </span>
                    <button
                      type="button"
                      aria-label="Quick add"
                      onClick={(e) => e.preventDefault()}
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all"
                    >
                      <img src={cartIconAsset.url} alt="" className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="pt-4">
                    <div className="text-[15px] font-semibold text-white leading-snug line-clamp-2 mb-1.5">
                      {g.title}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-semibold text-white">{fmt(sale)}</span>
                      {regular > sale && <span className="text-[13px] text-neutral-400 line-through">{fmt(regular)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByCard(1)}
            className="hidden sm:flex absolute -right-2 top-[38%] -translate-y-1/2 w-11 h-11 rounded-full bg-neutral-900 text-white items-center justify-center shadow-lg hover:bg-neutral-700 transition"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

type Review = { name: string; when: string; text: string };

const REVIEWS: Review[] = [
  { name: "Hitesh Sai", when: "3 days ago", text: "Best reasonable games they're providing. And service support as well. They'll make sure that it's worth for buying from TRXSHOP. Hoping to buy more further!" },
  { name: "Ashraf Khan", when: "1 week ago", text: "Bought a game from them — had a small login issue but their support team was quick to help once they were online. Very happy with the experience." },
  { name: "Arnab Bhattacharya", when: "2 weeks ago", text: "Fantastic customer service. Any doubts you have, they reply almost instantly. Highly recommend buying games here." },
  { name: "Snoop", when: "3 weeks ago", text: "This site is fantastic. Cheap, authentic games that work great. Hoping they bring in even more titles soon." },
  { name: "Akhil Swarop", when: "1 month ago", text: "A trustable company with very good customer feedback. They respond and act on every query immediately. Very satisfied." },
  { name: "Rahul Mathur", when: "1 month ago", text: "Amazing service for a great price. Was skeptical at first but they're really good — would recommend to anyone." },
  { name: "Priya Verma", when: "1 month ago", text: "Smooth purchase, instant delivery. Activation worked perfectly the first time. Will be back for more titles." },
  { name: "Vikram Singh", when: "2 months ago", text: "Great pricing on Steam accounts and the team is super responsive. Definitely the best place for budget gamers in India." },
];

function ReviewsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rcard]");
    const w = card ? card.offsetWidth + 20 : 360;
    let next = el.scrollLeft + dir * w;
    if (next >= el.scrollWidth - el.clientWidth - 4) next = 0;
    if (next < 0) next = el.scrollWidth;
    el.scrollTo({ left: next, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => scrollByCard(1), 3500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section className="border-t border-neutral-800 py-20 lg:py-28">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white mb-4 leading-tight">
            <span className="text-emerald-500">Customers</span>&nbsp;Feedback
          </h2>
          <div className="inline-flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-emerald-500">
              {[...Array(5)].map((_, i) => <Star key={i} size={22} fill="currentColor" strokeWidth={0} />)}
            </span>
            <span className="text-lg font-bold text-white ml-1">4.4/5</span>
            <span className="text-base text-neutral-400">(100+ verified reviews)</span>
          </div>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            type="button"
            aria-label="Previous reviews"
            onClick={() => scrollByCard(-1)}
            className="absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center shadow-lg hover:bg-neutral-800 transition"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next reviews"
            onClick={() => scrollByCard(1)}
            className="absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center shadow-lg hover:bg-neutral-800 transition"
          >
            <ChevronRight size={22} />
          </button>

          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 px-10 sm:px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {REVIEWS.map((r) => (
              <div
                key={r.name}
                data-rcard
                className="snap-start shrink-0 basis-full sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/2)] border border-neutral-700 rounded-2xl p-8 bg-neutral-900/70"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white leading-tight">{r.name}</h3>
                    <p className="text-sm text-neutral-400 mt-1">{r.when}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-full px-3 py-1.5 whitespace-nowrap">
                    <Check size={14} strokeWidth={3} /> Verified Buyer
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-emerald-500 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" strokeWidth={0} />)}
                </div>
                <p className="text-base text-neutral-200 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900/80 backdrop-blur-sm px-6 py-3 shadow-lg shadow-black/20">
            <ShieldCheck size={18} className="text-emerald-500" strokeWidth={2.5} />
            <span className="text-sm font-bold text-white tracking-wide">Based on <span className="text-emerald-400">100+ verified reviews</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}


