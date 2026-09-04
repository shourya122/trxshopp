/**
 * ProductCardSkeleton — shimmer placeholder matching the product card layout
 * used across the home "Newly Added" grid, /games catalog, and search results.
 *
 * Pure CSS shimmer (see `.skeleton-shimmer` in src/styles.css). No JS, no
 * layout thrash — runs on the compositor and respects prefers-reduced-motion.
 */
export function ProductCardSkeleton() {
  return (
    <div className="block" aria-hidden="true">
      <div className="skeleton-shimmer aspect-[3/4] w-full rounded-sm" />
      <div className="pt-4 space-y-2">
        <div className="skeleton-shimmer h-[14px] w-[85%] rounded" />
        <div className="skeleton-shimmer h-[14px] w-[60%] rounded" />
        <div className="skeleton-shimmer mt-3 h-[14px] w-16 rounded" />
      </div>
    </div>
  );
}

export function ProductCardSkeletonGrid({
  count = 10,
  className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className} role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
