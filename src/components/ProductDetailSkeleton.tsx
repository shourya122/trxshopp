/**
 * ProductDetailSkeleton — shimmer placeholder for /products/$id
 * Mirrors the real PDP layout: cover image left, info column right.
 */
export function ProductDetailSkeleton() {
  return (
    <div className="bg-black text-white font-['Poppins',sans-serif] min-h-dvh" aria-busy="true">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-24 pb-6 grid grid-cols-1 lg:grid-cols-[480px_minmax(0,1fr)] gap-12 lg:gap-20">
        {/* Image */}
        <div className="lg:sticky lg:top-6 self-start w-full">
          <div className="skeleton-shimmer h-80 w-full rounded-lg sm:h-[480px]" />
        </div>

        {/* Info */}
        <div className="lg:pl-8" role="status" aria-label="Loading product">
          <div className="skeleton-shimmer h-8 w-56 rounded-full mb-4" />
          <div className="space-y-3 mb-5">
            <div className="skeleton-shimmer h-8 w-[90%] rounded" />
            <div className="skeleton-shimmer h-8 w-[70%] rounded" />
          </div>
          <div className="flex items-baseline gap-3 mb-5">
            <div className="skeleton-shimmer h-8 w-28 rounded" />
            <div className="skeleton-shimmer h-7 w-24 rounded" />
          </div>
          <div className="skeleton-shimmer h-9 w-72 max-w-full rounded-md mb-6" />
          <div className="skeleton-shimmer h-24 w-full rounded-xl mb-6" />
          <div className="flex items-stretch gap-3 mb-3 h-14">
            <div className="skeleton-shimmer h-full w-32 rounded-lg" />
            <div className="skeleton-shimmer h-full flex-1 rounded-lg" />
          </div>
          <div className="skeleton-shimmer h-14 w-full rounded-lg mb-3" />
          <div className="skeleton-shimmer h-14 w-full rounded-lg mb-6" />
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 py-3">
                <div className="skeleton-shimmer h-12 w-12 rounded-full" />
                <div className="skeleton-shimmer h-3 w-20 rounded" />
                <div className="skeleton-shimmer h-3 w-16 rounded" />
              </div>
            ))}
          </div>
          <div className="skeleton-shimmer h-12 w-full rounded mb-6" />
          <div className="skeleton-shimmer h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * CartItemSkeleton — shimmer placeholder for the cart drawer line items.
 */
export function CartItemSkeleton() {
  return (
    <li className="flex gap-5 py-6" aria-hidden="true">
      <div className="skeleton-shimmer w-24 h-32 shrink-0 rounded-md" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="skeleton-shimmer h-4 w-[70%] rounded" />
          <div className="skeleton-shimmer h-4 w-16 rounded" />
        </div>
        <div className="skeleton-shimmer h-4 w-20 rounded" />
        <div className="flex items-center gap-3 pt-2">
          <div className="skeleton-shimmer h-10 w-28 rounded" />
          <div className="skeleton-shimmer h-8 w-8 rounded" />
        </div>
      </div>
    </li>
  );
}

export function CartDrawerSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex-1 overflow-hidden px-5 pt-5" role="status" aria-label="Loading cart">
      <div className="skeleton-shimmer h-7 w-24 rounded mb-2" />
      <ul className="divide-y divide-white/10">
        {Array.from({ length: count }).map((_, i) => (
          <CartItemSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}
