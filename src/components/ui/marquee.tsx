import * as React from "react"
import { cn } from "@/lib/utils"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  pauseOnHover?: boolean
  direction?: "left" | "right"
  speed?: number
}

export function Marquee({
  children,
  pauseOnHover = false,
  direction = "left",
  speed = 30,
  className,
  ...props
}: MarqueeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(false)
  const [reducedMotion, setReducedMotion] = React.useState(false)

  // Respect users who ask the OS to reduce motion.
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReducedMotion(mq.matches)
    onChange()
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])

  // Only animate when near the viewport AND tab is visible.
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let inView = false
    let tabVisible = typeof document !== "undefined" ? !document.hidden : true

    const update = () => setActive(inView && tabVisible)

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false
        update()
      },
      { rootMargin: "200px 0px" }
    )
    io.observe(el)

    const onVis = () => {
      tabVisible = !document.hidden
      update()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  const running = active && !reducedMotion

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full overflow-hidden sm:mt-24 mt-10 z-10 [content-visibility:auto] [contain-intrinsic-size:1px_120px]",
        className
      )}
      {...props}
    >
      <div className="relative flex w-full overflow-hidden py-5">
        <div
          className={cn(
            "flex w-max shrink-0 animate-marquee [backface-visibility:hidden] [transform:translate3d(0,0,0)] [contain:layout_paint_style]",
            running && "[will-change:transform]",
            pauseOnHover && "hover:[animation-play-state:paused]",
            direction === "right" && "animate-marquee-reverse"
          )}
          style={{
            "--duration": `${speed}s`,
            animationPlayState: running ? "running" : "paused",
          } as React.CSSProperties}
        >
          {children}
          <div className="flex" aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
