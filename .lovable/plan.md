## Audit findings

Two real bugs plus a small polish item — everything else in the checkout → order → Discord flow is wired correctly.

### 1. Crypto (OxaPay) orders never flip to "paid" — CRITICAL

`createCryptoInvoice` sends OxaPay a `callback_url` of `/api/public/oxapay-webhook`, but that route file does not exist. So after a customer pays in crypto, OxaPay POSTs the "paid" event into a 404 and the order sits at `status: pending` forever. Cashfree has a proper webhook; OxaPay does not.

### 2. Discord ID input goes nowhere — BUG

Checkout collects a "Discord ID (optional)" value into a `discord` state variable, but it is never included in either `createCashfreePaymentLink` or `createCryptoInvoice`. It is never saved to the `orders` row and never shown in the Discord order notification. From the customer's side the field looks functional; from your side it's dead.

### 3. Post-fix polish

Once crypto orders can flip to paid, post a "paid" update to `DISCORD_ORDERS_WEBHOOK_URL` from both webhooks so you see the full lifecycle (new order → paid) in Discord, matching what Cashfree can now do too.

## What to build

1. **Migration**: add `customer_discord text` to `public.orders`.
2. **New route** `src/routes/api/public/oxapay-webhook.ts`:
   - Verify OxaPay HMAC (`hmac` header, SHA-512 of raw body with `OXAPAY_MERCHANT_API_KEY`).
   - Parse `{ type, track_id, status, order_id }`; on `Paid` / `Confirming` completion set `status: paid`, `payment_status: paid`, `paid_at: now()`, `order_status: processing`, `payment_ref: track_id`, `raw_callback: payload`. On `Expired` / `Failed` set failed. Always 200-ack once processed.
   - After a successful "paid" update, fire the Discord "paid" embed.
3. **Wire Discord ID** through the client:
   - `PayWithCashfreeButton` + `PayWithCryptoButton`: add optional `discord?: string` prop, forward to their server fn.
   - Both server fns: extend Zod input, persist to `customer_discord`, include in the Discord embed payload.
   - `checkout.tsx`: pass `discord={discord}` to both buttons.
4. **Discord embed**: `postNewOrderToDiscord` gains an optional `customerDiscord` field rendered as its own row. Add a second helper `postOrderPaidToDiscord({ orderId, provider, amountInr })` used by both webhooks on payment success.
5. **Sanity**: `cashfree.functions.ts` already saves name/phone/address; only `customer_discord` gets added there. `oxapay.functions.ts` already saves those (from last turn); only `customer_discord` added.

## Technical notes

- OxaPay v1 webhook signature: `HMAC_SHA512(rawBody, merchant_api_key)` sent in the `hmac` header, hex-encoded. Use `timingSafeEqual` on equal-length buffers.
- OxaPay statuses to treat as paid: `Paid`. Treat `Expired`, `Failed` as failed. Ignore `Waiting` / `Confirming` (leave pending).
- Idempotency: guard with `if (existing.status === 'paid') return 200` so retries don't double-fire the Discord "paid" post.
- Public webhook: `/api/public/*` is unauth by design; signature check is the only gate — do the check before any DB write.
- Migration only adds a nullable column; no policy/grant change needed since existing policies already cover the row.

## Not changing

- Cashfree webhook logic (already correct).
- Checkout UI/layout.
- OxaPay pricing/currency/lifetime parameters.
