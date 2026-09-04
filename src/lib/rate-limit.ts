// Simple client-side sliding-window limiter to prevent accidental spam.
// Note: not a security control — backend has no rate-limiting primitives.
const timestamps: number[] = [];
const WINDOW_MS = 10_000;
const MAX = 10;

export function canAddToCart(): boolean {
  const now = Date.now();
  while (timestamps.length && now - timestamps[0] > WINDOW_MS) timestamps.shift();
  if (timestamps.length >= MAX) return false;
  timestamps.push(now);
  return true;
}
