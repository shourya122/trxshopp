import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, ShoppingBag, LayoutGrid, Grid3x3 } from "lucide-react";
import { listProducts } from "@/lib/products";
import type { Product, Platform } from "@/lib/types";
import { ImageWithSkeleton } from "@/components/ImageWithSkeleton";
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { useReveal } from "@/hooks/useReveal";
import cartIconAsset from "@/assets/cart-icon-v2.svg.asset.json";

import { flyToCart } from "@/lib/fly-to-cart";
import { canAddToCart } from "@/lib/rate-limit";

const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "active"],
    queryFn: () => listProducts({ activeOnly: true }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/games/")({
  head: () => ({
    meta: [
      { title: "All Games — PC, PlayStation & Xbox Keys | TRXSHOP" },
      { name: "description", content: "Browse the full TRXSHOP catalog of PC, PlayStation, and Xbox game keys. Filter by platform and price — instant digital delivery." },
      { property: "og:title", content: "All Games — PC, PlayStation & Xbox Keys | TRXSHOP" },
      { property: "og:description", content: "Full catalog of PC, PlayStation, and Xbox game keys with instant delivery and the best prices." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trxshop.xyz/games" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/games" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    ...(typeof s.q === "string" && s.q ? { q: s.q as string } : {}),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions()),
  pendingComponent: GamesPagePending,
  pendingMs: 0,
  component: GamesPage,
});

function GamesPagePending() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="px-4 sm:px-8 lg:px-16 py-8 lg:py-12 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <div className="skeleton-shimmer h-9 w-48 rounded" />
        </div>
        <div className="flex items-center gap-6 mb-8 pb-4 border-b border-neutral-800">
          <div className="skeleton-shimmer h-5 w-20 rounded" />
          <div className="skeleton-shimmer h-5 w-24 rounded" />
          <div className="skeleton-shimmer h-5 w-20 rounded" />
        </div>
        <ProductCardSkeletonGrid
          count={12}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10"
        />
      </div>
    </div>
  );
}

type Sort = "featured" | "price-asc" | "price-desc" | "rating" | "new";
type Avail = "all" | Platform;

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "rating", label: "Top rated" },
  { value: "new", label: "Newest" },
];

const AVAILS: { value: Avail; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pc", label: "PC / Steam" },
  { value: "ps", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
];

const PRICES: { id: string; label: string; min: number; max: number }[] = [
  { id: "all", label: "All prices", min: 0, max: 999999 },
  { id: "u500", label: "Under Rs. 500", min: 0, max: 499 },
  { id: "500_1000", label: "Rs. 500 – Rs. 1,000", min: 500, max: 1000 },
  { id: "1000_2000", label: "Rs. 1,000 – Rs. 2,000", min: 1000, max: 2000 },
  { id: "o2000", label: "Over Rs. 2,000", min: 2000, max: 999999 },
];

function GamesPage() {
  const { q } = Route.useSearch();
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  return <ProductsBrowser title="Products" products={products} searchQuery={q} />;
}

export function ProductsBrowser({
  title,
  breadcrumb,
  products,
  searchQuery = "",
}: {
  title: string;
  breadcrumb?: string;
  products: Product[];
  searchQuery?: string;
}) {
  const [avail, setAvail] = useState<Avail>("all");
  const [priceId, setPriceId] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [dense, setDense] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | "avail" | "price" | "sort">(null);

  const filtered = useMemo(() => {
    const priceRange = PRICES.find((p) => p.id === priceId)!;
    let r = (products || []).filter((p) => {
      if (avail !== "all" && !p.platforms.includes(avail)) return false;
      const sale = Math.round(p.priceCents / 100);
      if (sale < priceRange.min || sale > priceRange.max) return false;
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase().trim())) return false;
      return true;
    });
    if (sort === "price-asc") r = [...r].sort((a, b) => a.priceCents - b.priceCents);
    else if (sort === "price-desc") r = [...r].sort((a, b) => b.priceCents - a.priceCents);
    else if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    else if (sort === "new") r = [...r].sort((a, b) => b.createdAt - a.createdAt);
    return r;
  }, [products, avail, priceId, sort, searchQuery]);

  const currentSort = SORTS.find((s) => s.value === sort)!;
  const currentAvail = AVAILS.find((a) => a.value === avail)!;
  const currentPrice = PRICES.find((p) => p.id === priceId)!;

  return (
    <div className="bg-black text-white font-['Poppins',sans-serif] min-h-dvh">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-24 pb-16">
        {breadcrumb && (
          <div className="text-sm text-neutral-400 mb-3 font-semibold tracking-wide uppercase">{breadcrumb}</div>
        )}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-12 font-['Geist',sans-serif]">{title}</h1>

        {/* Filter / sort bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-y border-neutral-800 py-4 mb-8 relative">
          <div className="flex items-center gap-6">
            <FilterMenu
              label="Availability"
              value={currentAvail.label}
              open={openMenu === "avail"}
              onToggle={() => setOpenMenu(openMenu === "avail" ? null : "avail")}
            >
              {AVAILS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => { setAvail(a.value); setOpenMenu(null); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 ${avail === a.value ? "font-semibold" : ""}`}
                >
                  {a.label}
                </button>
              ))}
            </FilterMenu>
            <FilterMenu
              label="Price"
              value={currentPrice.label}
              open={openMenu === "price"}
              onToggle={() => setOpenMenu(openMenu === "price" ? null : "price")}
            >
              {PRICES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPriceId(p.id); setOpenMenu(null); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 ${priceId === p.id ? "font-semibold" : ""}`}
                >
                  {p.label}
                </button>
              ))}
            </FilterMenu>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-sm text-neutral-400">{filtered.length} items</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
                className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-neutral-300"
              >
                Sort <ChevronDown size={14} className={`transition-transform ${openMenu === "sort" ? "rotate-180" : ""}`} />
              </button>
              {openMenu === "sort" && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-md shadow-lg z-20 py-1 text-white">
                  <div className="px-4 py-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">{currentSort.label}</div>
                  {SORTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setSort(s.value); setOpenMenu(null); }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 ${sort === s.value ? "font-semibold" : ""}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 border-l border-neutral-800 pl-5">
              <button
                type="button"
                aria-label="Comfortable grid"
                onClick={() => setDense(false)}
                className={`p-1 rounded ${!dense ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                aria-label="Dense grid"
                onClick={() => setDense(true)}
                className={`p-1 rounded ${dense ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <Grid3x3 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-neutral-500">
            <div className="text-lg font-semibold mb-2">No products found</div>
            <p className="text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className={`grid gap-x-6 gap-y-10 ${dense ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
            {filtered.map((g) => <ProductCard key={g.id} g={g} />)}
          </div>
        )}
      </div>
    </div>
  );
}


function FilterMenu({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-neutral-300"
      >
        {label} <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-md shadow-lg z-20 py-1 text-white">
          <div className="px-4 py-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">{value}</div>
          {children}
        </div>
      )}
    </div>
  );
}

export function ProductCard({ g }: { g: Product }) {
  const sale = Math.round(g.priceCents / 100);
  const regular = g.oldPriceCents > 0 ? Math.round(g.oldPriceCents / 100) : sale;
  const { format } = useCurrency();
  const fmt = (n: number) => format(n * 100, { rs: true });
  const img = g.coverImage || g.screenshots[0] || "";
  const { add } = useCart();
  const numericId = Array.from(g.id).reduce((a, c) => a + c.charCodeAt(0), 0);
  const [adding, setAdding] = useState(false);
  const lockRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lockRef.current) return;
    if (!canAddToCart()) return;
    lockRef.current = true;
    setAdding(true);
    if (btnRef.current) flyToCart(btnRef.current, img);
    void add(
      {
        id: numericId,
        variantId: g.variantId,
        productId: g.id,
        name: g.title,
        platform: (g.platforms[0] || "pc"),
        price: sale,
        old: regular,
        steamId: numericId,
        image: img,
      },
      1,
    );
    
    setTimeout(() => {
      lockRef.current = false;
      setAdding(false);
    }, 800);
  };
  const { ref: revealRef, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={revealRef}
      className={`transition-all duration-[900ms] ease-out will-change-transform ${shown ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-6 blur-[2px]"}`}
    >
    <Link to="/products/$id" params={{ id: g.slug || g.id }} className="group block">

      <div className="relative overflow-hidden bg-neutral-900 aspect-[3/4] rounded-md [transform:translateZ(0)] transition-[transform,box-shadow] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.65)]">
        <ImageWithSkeleton
          src={img}
          alt={`${g.title} game cover`}
          loading="lazy"
          className="w-full h-full object-cover object-center transform-gpu [backface-visibility:hidden] [transform-origin:center] will-change-transform transition-transform duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />

        {/* Gradient sheen on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] ease-out" />
        {/* Subtle inner ring */}
        <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/0 group-hover:ring-white/10 transition-[box-shadow,--tw-ring-color] duration-[600ms] ease-out" />


        <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold rounded-full px-3 py-1">
          Sale
        </span>
        <button
          ref={btnRef}
          type="button"
          aria-label="Quick add"
          onClick={handleQuickAdd}
          disabled={adding}
          aria-busy={adding}
          className="hidden md:inline-flex absolute bottom-3 right-3 items-center justify-center gap-0 bg-white text-neutral-900 rounded-full text-sm font-semibold shadow-md border border-neutral-200 overflow-hidden w-10 h-10 hover:w-[110px] hover:gap-2 transition-all duration-300 hover:bg-neutral-100 disabled:cursor-not-allowed translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
        >
          {adding ? <Loader2 size={18} className="animate-spin shrink-0" /> : <img src={cartIconAsset.url} alt="" className="w-6 h-6 shrink-0" />}
          <span className="max-w-0 opacity-0 [button:hover_>_&]:max-w-[70px] [button:hover_>_&]:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">Add</span>
        </button>
      </div>

      <div className="pt-4">
        <div className="text-[15px] text-white leading-snug line-clamp-2 mb-1.5 font-semibold">
          {g.title}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-white">{fmt(sale)}</span>
          {regular > sale && <span className="text-[13px] text-neutral-500 line-through">{fmt(regular)}</span>}
        </div>
      </div>
    </Link>
    </div>
  );
}
