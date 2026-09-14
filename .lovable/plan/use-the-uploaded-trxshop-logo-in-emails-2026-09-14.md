# Use the uploaded TRXSHOP logo in emails

## What will change
- Prepare the uploaded logo for email by tightly trimming its large black canvas while preserving the blue mark and proportions.
- Store the email-safe logo through the project asset system and use its absolute `https://trxshop.in` URL so inboxes can load it.
- Add the centered logo header to every customer email: sign-up OTP, sign-in OTP, reauthentication, password reset, invitation, email change, order confirmation, and order delivered.
- Keep the current black email design, green actions, OTP styling, wording, and sending behavior unchanged.
- Replace the app favicon with a square, padded copy of the same uploaded brand mark, as required for uploaded brand marks.

## Technical details
- Add one small shared email-brand module for the logo URL and reusable email-safe image/header styles.
- Use React Email's `Img` component with explicit dimensions, alt text, and inline styles for broad email-client support.
- Update the root favicon link to the new PNG and remove the old ICO.
- Verify all templates render, the app builds cleanly, and the logo URL is reachable.
