// Loads the Cashfree JS SDK from our own origin (see /api/public/cf-sdk)
// so that ad blockers can't block sdk.cashfree.com, and opens the hosted
// checkout for the given payment_session_id.

type CashfreeFactory = (opts: { mode: "production" | "sandbox" }) => {
  checkout: (opts: {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
    returnUrl?: string;
  }) => Promise<unknown>;
};

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

const SDK_SRC = "/api/public/cf-sdk";
let sdkPromise: Promise<CashfreeFactory> | null = null;

function loadSdk(): Promise<CashfreeFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout can only run in the browser."));
  }
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-cf-sdk="1"]`,
    );
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src = SDK_SRC;
      script.async = true;
      script.dataset.cfSdk = "1";
      document.head.appendChild(script);
    }
    const timeout = window.setTimeout(() => {
      reject(new Error("Cashfree SDK timed out while loading."));
    }, 15000);
    script.addEventListener("load", () => {
      window.clearTimeout(timeout);
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error("Cashfree SDK loaded but window.Cashfree is missing."));
    });
    script.addEventListener("error", () => {
      window.clearTimeout(timeout);
      sdkPromise = null;
      reject(new Error("Cashfree SDK failed to load."));
    });
  });
  return sdkPromise;
}

export async function redirectToCashfreeCheckout(paymentSessionId: string, returnUrl?: string) {
  if (!paymentSessionId) {
    throw new Error("Cashfree payment session is missing.");
  }
  const Cashfree = await loadSdk();
  const cf = Cashfree({ mode: "production" });
  await cf.checkout({ paymentSessionId, redirectTarget: "_self", returnUrl });
}
