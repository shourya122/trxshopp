import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Check, AlertTriangle, Info, X, Loader2 } from "lucide-react";

/**
 * Polished dark toast — Bootstrap-style header/body split.
 *
 * Fixes vs previous pass:
 * - Removes the "blank bar" (empty header border) when a toast has only a
 *   title and no description, via a `:has()` selector on the title row.
 * - Smoother custom entry/exit animation with a soft blur + scale, and a
 *   `prefers-reduced-motion` fallback that fades without moving.
 */

const TOAST_STYLES = `
  @keyframes trx-toast-in {
    0%   { opacity: 0; transform: translate3d(0, 16px, 0) scale(0.96); filter: blur(4px); }
    60%  { opacity: 1; filter: blur(0); }
    100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
  }
  @keyframes trx-toast-out {
    0%   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    100% { opacity: 0; transform: translate3d(0, 8px, 0) scale(0.98); filter: blur(2px); }
  }

  [data-sonner-toaster] [data-sonner-toast] {
    animation: trx-toast-in 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity 240ms ease,
                box-shadow 240ms ease !important;
    will-change: transform, opacity, filter;
  }
  [data-sonner-toaster] [data-sonner-toast][data-removed="true"] {
    animation: trx-toast-out 240ms cubic-bezier(0.4, 0, 1, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-sonner-toaster] [data-sonner-toast],
    [data-sonner-toaster] [data-sonner-toast][data-removed="true"] {
      animation: none !important;
      transition: opacity 160ms ease !important;
      filter: none !important;
      transform: none !important;
    }
  }

  /* Indeterminate green progress bar for loading/pending toasts.
     Runs continuously until the toast is dismissed or its type changes. */
  @keyframes trx-toast-progress {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  [data-sonner-toaster] [data-sonner-toast][data-type="loading"]::after {
    content: "";
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #22C55E 40%, #4ADE80 60%, transparent 100%);
    animation: trx-toast-progress 1.2s linear infinite;
    pointer-events: none;
  }
`;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TOAST_STYLES }} />
      <Sonner
        position="bottom-right"
        gap={12}
        offset={24}
        duration={4000}
        icons={{
          success: <Check className="h-3.5 w-3.5" strokeWidth={2.5} />,
          error: <X className="h-3.5 w-3.5" strokeWidth={2.5} />,
          warning: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />,
          info: <Info className="h-3.5 w-3.5" strokeWidth={2.25} />,
          loading: <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />,
        }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: [
              "group relative w-[356px] overflow-hidden",
              "rounded-[10px] font-sans antialiased",
              "!bg-[linear-gradient(180deg,#0B0B0D_0%,#050506_100%)]",
              "!border !border-white/[0.08]",
              "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_50px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(0,0,0,0.5)]",
              "flex flex-col",
            ].join(" "),
            // Header row — title text sits to the right of the absolutely-placed icon.
            title: [
              "relative flex items-center pl-9 pr-10 h-10",
              "bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]",
              "text-[12.5px] font-semibold tracking-[-0.005em] text-white leading-none",
              "[&>svg]:hidden",
              "[&:has(~[data-description])]:border-b [&:has(~[data-description])]:border-white/[0.06]",
            ].join(" "),
            description: "px-3.5 py-3 text-[12.5px] leading-[1.55] text-white/65 tracking-[-0.003em]",
            // Icon pinned to the header's left edge so it always sits before the title text.
            icon: "!absolute !left-3.5 !top-3 shrink-0 inline-flex items-center justify-center h-4 w-4 m-0 p-0 z-10",
            actionButton: [
              "ml-auto inline-flex items-center h-[26px] px-2.5 rounded-md",
              "bg-white/[0.06] hover:bg-white/[0.1] text-white",
              "text-[11.5px] font-medium tracking-tight transition-colors",
            ].join(" "),
            cancelButton: "inline-flex items-center h-[26px] px-2.5 rounded-md text-white/55 text-[11.5px] hover:text-white transition-colors",
            closeButton: [
              "!absolute !right-2 !top-1/2 !left-auto !-translate-y-1/2",
              "!h-6 !w-6 !rounded-md !border-0",
              "!bg-white/[0.04] hover:!bg-white/[0.1]",
              "!text-white/50 hover:!text-white transition-colors",
            ].join(" "),
            // Per-variant icon color (SVG stroke) — no background, no ring.
            success: "[&_[data-icon]>svg]:!text-[#22C55E]",
            error: "[&_[data-icon]>svg]:!text-[#EF4444]",
            warning: "[&_[data-icon]>svg]:!text-[#F59E0B]",
            info: "[&_[data-icon]>svg]:!text-[#007AFF]",
            loading: "[&_[data-icon]>svg]:!text-[#007AFF]",
            default: "[&_[data-icon]>svg]:!text-[#007AFF]",
          },
        }}
        {...props}
      />
    </>
  );
};

export { Toaster };
