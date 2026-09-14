# What's missing before TRXSHOP is production-ready

Your store is in good shape: products, cart, checkout, variants, reviews, admin panel, email templates, legal pages, sitemap, and sign-in all work. Below is what I'd fix or add next, grouped by priority. Tell me which items you want and I'll build them.

## Critical — do these before real customers

1. **Broken product images** — Many product covers still point to expiring Discord CDN links that return 404. Fix: bulk-migrate all product images into your own storage so they never break again.
2. **Card/UPI payments (Cashfree) credentials** — Crypto (OxaPay) is set up, but confirm Cashfree keys are configured and test one real card/UPI order end to end, including the webhook updating the order status.
3. **Test a full order** — Place a test order: pay → confirmation email → order appears in admin → mark delivered → delivery email with code. Verify each step.

## Important — trust and conversion

4. **Delivery automation** — How do customers receive their game/account/code after payment? Right now it's manual via admin. Options: attach codes/credentials to products in admin and auto-send them in the delivery email.
5. **Refund/policy check** — Your refund & cancellation page should match how you actually handle digital-goods refunds, since digital items are usually non-refundable once delivered.
6. **OG share images** — Product pages have no share image, so links pasted in WhatsApp/X show no preview. Add per-product share images.
7. **Support channel** — support@trxshop.in is on the contact page; make sure that mailbox actually receives mail (email infra for trxshop.in was set up — verify inbound works).

## Nice to have — growth

8. **Google Search Console + indexing** — Submit the sitemap, verify the domain, and check indexing so products show up on Google.
9. **Analytics on the live site** — Track visitors, top products, and conversion.
10. **Discount/coupon promotion** — Coupons exist in admin; add a banner or first-order discount code on the homepage to drive first sales.
11. **Order status notifications** — Let customers see live order status on their account page (they can already view orders; add clearer status timeline).
12. **Backup of product data** — Export your product/catalog data regularly so you never lose it again.

## My recommended order

```text
1. Fix broken images (bulk migrate to own storage)
2. Verify Cashfree + place a full test order
3. Set up delivery automation for codes
4. OG share images for products
5. Search Console submission
```

Tell me which items to start with — I suggest beginning with #1 (images) and #2 (payments test) since they directly lose you sales.
