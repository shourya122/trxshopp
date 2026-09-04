"use client";
import React from "react";

export function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);
  const frame = React.useRef<number | null>(null);
  const scrolledRef = React.useRef(false);

  const onScroll = React.useCallback(() => {
    if (frame.current !== null) return;
    frame.current = window.requestAnimationFrame(() => {
      const next = scrolledRef.current
        ? window.scrollY > Math.max(0, threshold - 8)
        : window.scrollY > threshold + 8;

      if (next !== scrolledRef.current) {
        scrolledRef.current = next;
        setScrolled(next);
      }

      frame.current = null;
    });
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) {
        window.cancelAnimationFrame(frame.current);
      }
    };
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}
