# TRXSHOP Roadmap

## Open
- Add logo to email templates (auth/order emails) — user asked how-to; awaiting go-ahead or specific templates.
- SellAuth: user must paste webhook URL https://trxshop.in/api/public/sellauth-webhook into SellAuth dashboard (Shop → Notifications/Webhooks) after publish; live checkout test still pending.

## Done
- SellAuth checkout + delivery: createSellauthCheckout server fn, /api/public/sellauth-webhook (HMAC-SHA256 X-Signature, amount verification), PayWithSellauthButton, checkout option, admin SellAuth product/variant ID mapping (products.sellauth_product_id, editions[].sellauth_variant_id).

## Done
- Remove the home dot grid and restore continuous marquee motion.
- Repair and verify the home marquee loop and ambient background animation.
- Fix email sender name typo: `trxxshop` → `Trx Shop` across all email routes/helpers.
- [x] Check site code/secrets can't be extracted
