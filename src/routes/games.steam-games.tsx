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

const steamQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "category", "pc"],
    queryFn: () => listByCategory("pc"),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/games/steam-games")({
  head: () => ({
    meta: [
      { title: "Steam Games — PC Game Keys & Accounts | TRXSHOP" },
      { name: "description", content: "Browse Steam game keys and PC accounts on TRXSHOP. Instant digital delivery at the best prices." },
      { property: "og:title", content: "Steam Games — PC Game Keys & Accounts | TRXSHOP" },
      { property: "og:description", content: "Full catalog of Steam game keys with instant delivery." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trxshop.xyz/games/steam-games" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/games/steam-games" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    ...(typeof s.q === "string" && s.q ? { q: s.q as string } : {}),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(steamQueryOptions()),
  pendingComponent: Pending,
  pendingMs: 0,
  component: SteamGamesPage,
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

function SteamGamesPage() {
  const { q } = Route.useSearch();
  const { data: pc } = useSuspenseQuery(steamQueryOptions());
  return <ProductsBrowser title="Steam Games" breadcrumb="Products / Steam Games" products={pc} searchQuery={q} />;
}
