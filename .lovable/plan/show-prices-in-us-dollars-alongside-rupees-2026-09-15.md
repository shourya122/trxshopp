# Show prices in US dollars alongside rupees

Customers outside India will be able to read prices in dollars. Rupees stay the real charging currency — the dollar figure is a reference only.

## What you get

1. **A rate you control** — a new "Currency" box in the admin Settings page where you type today's rate (for example, 1 USD = 88 INR). Saved instantly, used everywhere on the site. Nothing fetches rates automatically, so the number only changes when you change it.
2. **A ₹ / $ switch in the header** — next to search/cart. The choice is remembered on that visitor's device, so a customer from the US sets it once and keeps seeing dollars.
3. **Dollar prices everywhere prices appear** — home page cards, all game/subscription listing pages, search results, product page (including edition and option prices), cart drawer, checkout summary, order confirmation and account order history.
4. **An approximate line on product pages** — under the main price, the other currency is shown small, e.g. `≈ $12.99` when viewing in rupees, or `≈ ₹1,149` when viewing in dollars.
5. **Checkout still charges in rupees.** When a visitor is viewing dollars, the checkout total shows the dollar figure plus a clear note: "You will be charged ₹1,149.00 INR". Payment pages, invoices and emails stay rupee-only, so nothing about payments or refunds changes.

Admin panel figures (revenue, order totals, analytics) stay in rupees — those are your books, not customer-facing.

## Technical detail

**Data**
- New migration: `public.site_settings` (`key` text primary key, `value` jsonb, timestamps) with GRANTs — `SELECT` to `anon` and `authenticated`, full access to `service_role`; RLS on with a public read policy and a write policy gated on `has_role(auth.uid(), 'admin')`. Seeded with `usd_inr_rate` = 88.
- Rate read via a public unauthenticated `createServerFn` in `src/lib/settings.functions.ts` (`getPublicSettings`), fetched once through TanStack Query in `__root.tsx` with a long `staleTime`; admin write via `adminUpdateSetting` (`requireSupabaseAuth` + admin role check).

**Display layer**
- New `src/lib/currency.tsx`: `CurrencyProvider` (holds `currency: "INR" | "USD"`, `rate`, persists choice in `localStorage`, hydration-safe so SSR renders INR first) plus `useCurrency()` and a `usePrice()` helper exposing `format(cents)` and `formatBoth(cents)`. Rounding: USD to 2 decimals via `Intl.NumberFormat("en-US")`, INR via existing `en-IN` formatting.
- Provider mounted in `src/routes/__root.tsx` above `<Outlet />`.
- Replace inline `₹{...}` price markup with the formatter in: `src/routes/index.tsx`, `games.index.tsx`, `games.all.tsx`, `games.steam-games.tsx`, `games.playstation-games.tsx`, `games.subscriptions.tsx`, `products.$id.tsx`, `checkout.tsx`, `order.$id.tsx`, `account.tsx`, `src/components/SearchModal.tsx`, `src/components/ui/header-2.tsx` (cart drawer). Non-price copy such as the "₹299+" promo banners is left as-is.
- `formatPrice` in `src/lib/types.ts` stays for server/email/admin use.
- Header toggle: small segmented `₹ | $` control in `header-2.tsx` matching the existing dark header styling.

**Not touched**
- Cart totals, coupon math, Cashfree/OxaPay payloads, order records and email templates keep working in integer paise. No conversion enters any write path.
