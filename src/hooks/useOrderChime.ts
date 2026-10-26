import { useEffect, useRef } from "react";
import { playSuccessSound } from "@/lib/success-sound";

/**
 * Watches the admin order list and plays the success chime once whenever
 * a new order id appears (auto-refresh / window focus). Skips the first load.
 */
export function useNewOrderChime(rows: { id: string }[] | undefined) {
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!rows) return;
    const ids = new Set(rows.map((r) => r.id));
    const prev = known.current;
    known.current = ids;
    if (!prev) return;
    for (const id of ids) {
      if (!prev.has(id)) {
        playSuccessSound();
        break;
      }
    }
  }, [rows]);
}
