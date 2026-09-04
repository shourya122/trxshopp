import { CSSProperties } from "react";

interface LoaderProps {
  /** Size in pixels. Defaults to 96. */
  size?: number;
  className?: string;
  /** Optional accessible label. */
  label?: string;
}

/**
 * Four-ring animated loader. Pure CSS/SVG — no runtime dependency.
 * Use for page and section-level loading states.
 */
export function Loader({ size = 96, className = "", label = "Loading" }: LoaderProps) {
  const style = { width: size, height: size } as CSSProperties;
  return (
    <div
      role="status"
      aria-label={label}
      className={`trx-loader inline-block ${className}`}
      style={style}
    >
      <svg width="100%" height="100%" viewBox="0 0 240 240" aria-hidden="true">
        <circle
          className="trx-loader__ring trx-loader__ring--a"
          cx={120} cy={120} r={105}
          fill="none" strokeWidth={20} strokeLinecap="round"
          strokeDasharray="0 660" strokeDashoffset={-330}
        />
        <circle
          className="trx-loader__ring trx-loader__ring--b"
          cx={120} cy={120} r={35}
          fill="none" strokeWidth={20} strokeLinecap="round"
          strokeDasharray="0 220" strokeDashoffset={-110}
        />
        <circle
          className="trx-loader__ring trx-loader__ring--c"
          cx={85} cy={120} r={70}
          fill="none" strokeWidth={20} strokeLinecap="round"
          strokeDasharray="0 440"
        />
        <circle
          className="trx-loader__ring trx-loader__ring--d"
          cx={155} cy={120} r={70}
          fill="none" strokeWidth={20} strokeLinecap="round"
          strokeDasharray="0 440"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Full viewport centered loader. */
export function PageLoader({ label, size = 120 }: { label?: string; size?: number }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#0A0B0E] text-white/60">
      <Loader size={size} />
      {label && (
        <div className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</div>
      )}
    </div>
  );
}

export default Loader;
