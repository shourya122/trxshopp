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
  const [active, setActive] = React.useState(true)

  // Only animate when near the viewport AND tab is visible.
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let inView = true
    let tabVisible = typeof document !== "undefined" ? !document.hidden : true

    const update = () => setActive(inView && tabVisible)

    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false
        update()
      },
      { rootMargin: "200px 0px" }
    )
    io?.observe(el)
    update()

    const onVis = () => {
      tabVisible = !document.hidden
      update()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      io?.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  const running = active

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full overflow-hidden sm:mt-24 mt-10 z-10",
        className
      )}
      {...props}
    >
      <div className="relative flex w-full overflow-hidden py-5 group">
        <div
          className={cn(
            "trx-marquee-track flex w-max min-w-[200%] shrink-0 animate-marquee [backface-visibility:hidden]",
            running && "[will-change:transform]",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            direction === "right" && "animate-marquee-reverse"
          )}
          style={{
            "--duration": `${speed}s`,
            animationPlayState: running ? "running" : "paused",
          } as React.CSSProperties}
        >
          <div className="flex flex-1 shrink-0 items-center justify-around" data-marquee-group>
            {children}
          </div>
          <div className="flex flex-1 shrink-0 items-center justify-around" data-marquee-group aria-hidden="true" inert>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
