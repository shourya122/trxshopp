import type React from "react";
import { cn } from "@/lib/utils";

interface DarkGradientBgProps {
  children?: React.ReactNode;
  className?: string;
}

export function DarkGradientBg({ children, className }: DarkGradientBgProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-black text-white",
        className
      )}
    >
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04181c] via-[#02080c] to-black" />

      {/* Skewed fading teal streaks */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/4 h-[120%] w-[55%] -skew-x-12 bg-gradient-to-b from-cyan-400/30 via-teal-500/10 to-transparent blur-3xl" />
        <div className="absolute -top-1/4 left-1/2 h-[110%] w-[40%] -skew-x-12 bg-gradient-to-b from-teal-300/25 via-cyan-500/5 to-transparent blur-3xl" />
        <div className="absolute -top-1/3 -left-10 h-[120%] w-[35%] -skew-x-12 bg-gradient-to-b from-cyan-500/15 via-teal-500/5 to-transparent blur-3xl" />
      </div>

      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Subtle radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(94,234,212,0.25),transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

export default DarkGradientBg;
