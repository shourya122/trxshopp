import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] text-[#A1A1AA]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-[#111113] ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  delta,
  trend,
  spark,
  index = 0,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  spark: number[];
  index?: number;
}) {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const range = Math.max(1, max - min);
  const w = 120;
  const h = 32;
  const step = w / (spark.length - 1);
  const points = spark
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-xl border border-white/[0.06] bg-[#111113] p-5 transition-colors hover:border-white/[0.1]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#A1A1AA]">{label}</span>
        <span
          className={`text-[11px] font-medium tabular-nums ${
            trend === "up" ? "text-[#22C55E]" : "text-[#EF4444]"
          }`}
        >
          {trend === "up" ? "↑" : "↓"} {delta}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-[26px] font-semibold tracking-tight tabular-nums text-white">
          {value}
        </span>
        <svg width={w} height={h} className="overflow-visible">
          <defs>
            <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          <polygon
            fill={`url(#g-${label})`}
            points={`0,${h} ${points} ${w},${h}`}
          />
        </svg>
      </div>
    </motion.div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/[0.06] text-[#A1A1AA] border-white/[0.06]",
    success: "bg-[#22C55E]/10 text-[#4ade80] border-[#22C55E]/20",
    warning: "bg-[#F59E0B]/10 text-[#fbbf24] border-[#F59E0B]/20",
    danger: "bg-[#EF4444]/10 text-[#f87171] border-[#EF4444]/20",
    info: "bg-[#2563EB]/10 text-[#60a5fa] border-[#2563EB]/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${tones[tone]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {children}
    </span>
  );
}