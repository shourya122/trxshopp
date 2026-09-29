import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DEFAULT_USD_INR_RATE, getPublicSettings, getVisitorCountry } from "@/lib/settings.functions";

export type Currency = "INR" | "USD";

const STORAGE_KEY = "trx-currency";
/** Visitors from these countries see rupees by default; everyone else sees dollars. */
const INR_COUNTRIES = new Set(["IN", "NP", "BD", "LK"]);

export type FormatOpts = {
  /** Use the "Rs. 599.00" style instead of "₹599" (INR only). */
  rs?: boolean;
  /** Number of decimals for INR output (USD is always 2). */
  decimals?: number;
};

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rate: number;
  /** Format an amount in paise/cents in the visitor's chosen currency. */
  format: (cents: number, opts?: FormatOpts) => string;
  /** Format the same amount in the other currency (for "≈" reference lines). */
  formatAlt: (cents: number, opts?: FormatOpts) => string;
  formatINR: (cents: number, opts?: FormatOpts) => string;
  formatUSD: (cents: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function inr(cents: number, opts?: FormatOpts) {
  const decimals = opts?.decimals ?? (opts?.rs ? 2 : 0);
  const value = (Number(cents) || 0) / 100;
  const num = value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return opts?.rs ? `Rs. ${num}` : `₹${num}`;
}

function usd(cents: number, rate: number) {
  const value = (Number(cents) || 0) / 100 / (rate || DEFAULT_USD_INR_RATE);
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("INR");

  const countryFn = useServerFn(getVisitorCountry);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (saved === "USD" || saved === "INR") {
      setCurrencyState(saved);
      return;
    }
    // No manual choice yet: pick by visitor location.
    countryFn()
      .then(({ country }) => {
        if (country) {
          if (!INR_COUNTRIES.has(country)) setCurrencyState("USD");
          return;
        }
        // Header unavailable (e.g. some hosts): infer from device timezone.
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
          const inrTz = ["Asia/Kolkata", "Asia/Calcutta", "Asia/Kathmandu", "Asia/Dhaka", "Asia/Colombo"];
          if (tz && !inrTz.includes(tz)) setCurrencyState("USD");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  }, [countryFn]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const settingsFn = useServerFn(getPublicSettings);
  const { data } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => settingsFn(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const rate = data?.usdInrRate ?? DEFAULT_USD_INR_RATE;

  const value = useMemo<CurrencyContextValue>(() => {
    const formatINR = (cents: number, opts?: FormatOpts) => inr(cents, opts);
    const formatUSD = (cents: number) => usd(cents, rate);
    return {
      currency,
      setCurrency,
      rate,
      formatINR,
      formatUSD,
      format: (cents, opts) => (currency === "USD" ? formatUSD(cents) : formatINR(cents, opts)),
      formatAlt: (cents, opts) => (currency === "USD" ? formatINR(cents, opts) : formatUSD(cents)),
    };
  }, [currency, rate, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

/** Safe outside the provider (admin routes, emails previews) — falls back to INR. */
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  const rate = DEFAULT_USD_INR_RATE;
  return {
    currency: "INR",
    setCurrency: () => {},
    rate,
    formatINR: (cents, opts) => inr(cents, opts),
    formatUSD: (cents) => usd(cents, rate),
    format: (cents, opts) => inr(cents, opts),
    formatAlt: (cents) => usd(cents, rate),
  };
}
