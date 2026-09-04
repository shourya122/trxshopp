import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/products";
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton";
import { ProductsBrowser } from "./games.index";

const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "active"],
    queryFn: () => listProducts({ activeOnly: true }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/games/all")({
  head: () => ({
    meta: [
      { title: "All Products — PC, PlayStation, Xbox & Subscriptions | TRXSHOP" },
      { name: "description", content: "Browse every product on TRXSHOP — PC keys, PlayStation, Xbox and subscription plans. Instant digital delivery." },
      { property: "og:title", content: "All Products — TRXSHOP" },
      { property: "og:description", content: "Full catalog of games and subscriptions with instant delivery." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trxshop.xyz/games/all" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/games/all" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    ...(typeof s.q === "string" && s.q ? { q: s.q as string } : {}),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions()),
  pendingComponent: Pending,
  pendingMs: 0,
  component: AllProductsPage,
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

function AllProductsPage() {
  const { q } = Route.useSearch();
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  return <ProductsBrowser title="All Products" breadcrumb="Products / All" products={products} searchQuery={q} />;
}
