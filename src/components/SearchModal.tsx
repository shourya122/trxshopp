import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Clock } from "lucide-react";
import { listProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const RECENT_KEY = "trxshop:recent-products";
const RECENT_MAX = 8;

interface RecentProduct {
  id: string;
  slug?: string;
  title: string;
  image?: string;
  priceCents: number;
  oldPriceCents: number;
}

function useFmt() {
  const { format } = useCurrency();
  return (n: number) => format(n * 100, { rs: true });
}

function loadRecent(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentProduct[]).slice(0, RECENT_MAX) : [];
  } catch { return []; }
}
function saveRecent(p: Product) {
  if (typeof window === "undefined") return;
  try {
    const entry: RecentProduct = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      image: p.coverImage || p.screenshots[0] || "",
      priceCents: p.priceCents,
      oldPriceCents: p.oldPriceCents,
    };
    const list = loadRecent().filter((r) => r.id !== p.id);
    list.unshift(entry);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {}
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: products, isPending } = useQuery({
    queryKey: ["products", "active", "search"],
    queryFn: () => listProducts({ activeOnly: true }),
    staleTime: 30_000,
    enabled: open,
  });

  const results = useMemo(() => {
    if (!query.trim() || !products) return [];
    const q = query.toLowerCase().trim();
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [query, products]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setRecent(loadRecent());
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  const handleProductClick = useCallback(
    (p: Product) => {
      saveRecent(p);
      onClose();
    },
    [onClose],
  );

  const clearRecent = useCallback(() => {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(RECENT_KEY); } catch {}
    setRecent([]);
  }, []);

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const showNoResults = hasQuery && !isPending && results.length === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in"
      onClick={handleBackdropClick}
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-4xl bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white/10 animate-scale-in noise-overlay"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-white/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, keys…"
            className="flex-1 bg-transparent text-white placeholder:text-white/40 text-base outline-none"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          />
          <span className="kbd hidden sm:inline-flex">ESC</span>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 text-white/60 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 bg-[#0a0a0a]">
          {!hasQuery ? (
            recent.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" /> Recent
                  </p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-[11px] font-medium text-white/50 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5">
                  {recent.map((r) => (
                    <RecentProductCard key={r.id} product={r} onClose={onClose} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/70 text-sm font-medium mb-1">No recent products</p>
                <p className="text-white/40 text-xs">Products you view will appear here.</p>
              </div>
            )
          ) : isPending ? (
            <>
              <div className="skeleton-shimmer h-3 w-20 rounded mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : showNoResults ? (
            <div className="text-center py-16">
              <p className="text-white text-base font-medium mb-1">
                No results for &quot;{query.trim()}&quot;
              </p>
              <p className="text-white/60 text-sm">Try a different keyword.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">
                {results.length} result{results.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-x-3 gap-y-5">

                {results.map((p) => (
                  <div key={p.id} className="stagger-item">
                    <SearchProductCard product={p} onClick={() => handleProductClick(p)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const fmt = useFmt();
  const sale = Math.round(product.priceCents / 100);
  const regular =
    product.oldPriceCents > 0 ? Math.round(product.oldPriceCents / 100) : sale;
  const img = product.coverImage || product.screenshots[0] || "";

  return (
    <Link
      to="/products/$id"
      params={{ id: product.slug || product.id }}
      onClick={onClick}
      className="group block"
    >
      <div className="relative overflow-hidden bg-white/5 aspect-[3/4] rounded-lg">
        {img ? (
          <img
            src={img}
            alt={`${product.title} cover`}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
            No image
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <h3 className="text-[13px] font-medium text-white leading-snug line-clamp-2">
          {product.title}
        </h3>
        <div className="mt-1 flex items-baseline gap-1.5">
          {regular > sale && (
            <span className="text-[12px] text-white/40 line-through">
              {fmt(regular)}
            </span>
          )}
          <span className="text-[13px] font-bold text-white">
            {fmt(sale)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RecentProductCard({
  product,
  onClose,
}: {
  product: RecentProduct;
  onClose: () => void;
}) {
  const sale = Math.round(product.priceCents / 100);
  const regular =
    product.oldPriceCents > 0 ? Math.round(product.oldPriceCents / 100) : sale;

  return (
    <Link
      to="/products/$id"
      params={{ id: product.slug || product.id }}
      onClick={onClose}
      className="group block"
    >
      <div className="relative overflow-hidden bg-white/5 aspect-[3/4] rounded-lg">
        {product.image ? (
          <img
            src={product.image}
            alt={`${product.title} cover`}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
            No image
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <h3 className="text-[13px] font-medium text-white leading-snug line-clamp-2">
          {product.title}
        </h3>
        <div className="mt-1 flex items-baseline gap-1.5">
          {regular > sale && (
            <span className="text-[12px] text-white/40 line-through">
              {fmt(regular)}
            </span>
          )}
          <span className="text-[13px] font-bold text-white">
            {fmt(sale)}
          </span>
        </div>
      </div>
    </Link>
  );
}
