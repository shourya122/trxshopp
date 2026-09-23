# Plan: Supreme Market-inspired TRXSHOP redesign

## What I’ll change
- Rework the public storefront to feel closer to the reference site: dark premium marketplace, bright green/blue accents, centered hero, soft game/account imagery, brand/logo strip, category browsing, trust/support sections, and stronger product discovery.
- Keep TRXSHOP’s identity, products, cart, checkout, sign-in, admin panel, payments, sounds, dual-currency switch, and existing backend logic intact.
- Avoid copying the reference site 1:1 or using their private assets; this will be a TRXSHOP version inspired by the structure, motion, spacing, and marketplace feel.

## Pages/areas included
- Homepage first: hero, navigation feel, moving brand/service strip, category/product discovery, “why choose us” trust blocks, support/payment confidence section.
- Shared header polish: keep the current working cart/search/account/currency controls, but make the layout closer to the reference and avoid the previous clipping issue.
- Product cards/listing previews on the homepage: stronger dark cards, clearer pricing, stock/instant-delivery signals, and smoother hover/motion.

## What I won’t change
- No checkout/payment logic changes.
- No admin product editor changes.
- No database changes unless a missing category field forces a small read-only display fallback.
- No copied Supreme Market branding, text, or external hotlinked images.

## Visual direction
- Dark full-screen storefront with a subtle dotted/grid background.
- Centered bold hero copy: TRXSHOP, instant delivery, trusted support, secure payments.
- Bright green primary action accents with TRXSHOP blue kept as a secondary brand accent.
- Brand/service logo carousel using your restored local assets where available.
- Rounded dark marketplace cards with compact product/category counts and browse actions.

## Technical notes
- Update the homepage route and shared styles/tokens only where needed.
- Use existing product data and existing image components.
- Keep semantic route metadata updated for the homepage.
- Verify on the current mobile-sized viewport and desktop so the header/cart stays visible and text does not clip.
