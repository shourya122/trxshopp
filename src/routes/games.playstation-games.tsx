import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton";
import { ProductsBrowser } from "./games.index";
import type { Product, Platform } from "@/lib/types";

async function listByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("category", category)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    shopifyHandle: r.slug,
    variantId: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? "",
    productDetails: r.product_details ?? "",
    termsConditions: r.terms_conditions ?? "",
    genre: r.genre ?? "",
    developer: r.developer ?? "",
    publisher: r.publisher ?? "",
    releaseDate: r.release_date ?? "",
    languages: r.languages ?? "English",
    platforms: ((r.platforms ?? ["pc"]) as Platform[]),
    coverImage: r.cover_image ?? "",
    screenshots: r.screenshots ?? [],
    priceCents: r.price_cents,
    oldPriceCents: r.old_price_cents,
    stock: r.stock,
    active: r.active,
    featured: r.featured,
    badge: (r.badge as Product["badge"]) || "",
    editions: [],
    optionGroups: [], editionsLabel: "",
    rating: typeof r.rating === "string" ? parseFloat(r.rating) : r.rating,
    votes: "0",
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  }));
}

const psQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "category", "ps"],
    queryFn: () => listByCategory("ps"),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/games/playstation-games")({
  head: () => ({
    meta: [
      { title: "PlayStation Games — PSN Account Keys | TRXSHOP" },
      { name: "description", content: "Browse PlayStation game keys and PSN accounts on TRXSHOP. Instant digital delivery at the best prices." },
      { property: "og:title", content: "PlayStation Games — PSN Account Keys | TRXSHOP" },
      { property: "og:description", content: "Full catalog of PlayStation game keys with instant delivery." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trxshop.xyz/games/playstation-games" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/games/playstation-games" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    ...(typeof s.q === "string" && s.q ? { q: s.q as string } : {}),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(psQueryOptions()),
  pendingComponent: Pending,
  pendingMs: 0,
  component: PlaystationGamesPage,
});

function Pending() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-24 pb-16">
        <div className="skeleton-shimmer h-12 w-80 rounded mb-12" />
        <ProductCardSkeletonGrid
          count={12}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10"
        />
      </div>
    </div>
  );
}

function PlaystationGamesPage() {
  const { q } = Route.useSearch();
  const { data: ps } = useSuspenseQuery(psQueryOptions());
  return <ProductsBrowser title="PlayStation Games" breadcrumb="Products / PlayStation Games" products={ps} searchQuery={q} />;
}
