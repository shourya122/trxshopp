import { toast } from "sonner";

type Msg<T> = string | ((v: T) => string);
type ErrMsg = string | ((e: unknown) => string);

export interface ToastPromiseOptions<T> {
  loading: string;
  success: Msg<T>;
  error: ErrMsg;
  /** Milliseconds before the loading toast flips to a "still working" warning. Default 8000. */
  timeoutMs?: number;
  /** Text shown when the timeout fires. */
  timeoutMessage?: string;
  /** Optional retry handler — surfaced as an action button on the timeout toast. */
  onRetry?: () => void;
}

const resolve = <T,>(m: Msg<T>, v: T): string => (typeof m === "function" ? (m as (v: T) => string)(v) : m);
const resolveErr = (m: ErrMsg, e: unknown): string => (typeof m === "function" ? m(e) : m);

/**
 * Wraps a promise with a sonner toast that shows an animated loading state,
 * and — if the promise takes longer than `timeoutMs` — flips the SAME toast
 * into an actionable warning ("Still working…") with an optional Retry action.
 * The toast still resolves to success/error when the underlying promise settles.
 */
export function toastPromise<T>(promise: Promise<T>, opts: ToastPromiseOptions<T>): Promise<T> {
  const { loading, success, error, timeoutMs = 8000, timeoutMessage, onRetry } = opts;
  const id = toast.loading(loading);
  let settled = false;

  const timer = window.setTimeout(() => {
    if (settled) return;
    toast.warning(timeoutMessage ?? "Still working — this is taking longer than expected", {
      id,
      description: "The server hasn't responded yet. You can wait or retry.",
      duration: Infinity,
      action: onRetry
        ? { label: "Retry", onClick: () => onRetry() }
        : undefined,
    });
  }, timeoutMs);

  promise.then(
    (v) => {
      settled = true;
      window.clearTimeout(timer);
      toast.success(resolve(success, v), { id, duration: 4000 });
    },
    (e) => {
      settled = true;
      window.clearTimeout(timer);
      toast.error(resolveErr(error, e), { id, duration: 6000 });
    },
  );

  return promise;
}
