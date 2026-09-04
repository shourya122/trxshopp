import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
  skeletonClassName?: string;
};

/**
 * Image that shows a shimmering skeleton placeholder until the source loads.
 * The wrapper must be sized by the parent (or via wrapperClassName) so the
 * skeleton has dimensions before the image arrives.
 */
export function ImageWithSkeleton({
  className,
  wrapperClassName,
  skeletonClassName,
  onLoad,
  onError,
  ...imgProps
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const ready = loaded || errored;

  return (
    <div className={cn("relative w-full h-full", wrapperClassName)}>
      {!ready && (
        <Skeleton
          className={cn(
            "absolute inset-0 w-full h-full rounded-none bg-neutral-800/60",
            skeletonClassName,
          )}
        />
      )}
      <img
        {...imgProps}
        className={cn(
          className,
          "transition-opacity duration-500",
          ready ? "opacity-100" : "opacity-0",
        )}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setErrored(true);
          onError?.(e);
        }}
      />
    </div>
  );
}
