# Nakshatra booking site

Nakshatra is a responsive, Nilima-led astrology consultation website with three transparent offers:

| Reading | Duration | Price |
| --- | ---: | ---: |
| Personal Consultation | 60 minutes | ₹1,099 |
| Relationship Consultation (Kundli Milan) | 60 minutes | ₹1,499 |
| Muhurat | 30 minutes | ₹499 |

Visitors can see a Nakshatra-designed Personal Consultation calendar directly in the landing-page hero and compare three concise readings. On `/book/`, each full-width service row goes straight to that service's exact event page; there is no second scheduler after the choices. The hero reads live availability through a server-only Cal ID proxy, then sends the selected slot to Cal ID for attendee details, Razorpay payment, confirmation, and Google Meet. The website never collects birth, attendee, or payment details.

## Local setup

Requirements: a supported Node.js release and npm.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run check
npm test
npm run build
```

The active local preview is `http://127.0.0.1:4173/`. The production build is written to `dist/`.

The committed `package-lock.json` keeps installs reproducible.

## Private admin schedule

The installable `/admin/` PWA reads sanitized Cal ID lifecycle events from a protected same-origin API. Production never falls back to sample appointments. Sample data is available only during development when `PUBLIC_ADMIN_DEMO_MODE=true`, and the screen labels it clearly.

Setup instructions for Neon Postgres through Vercel, the single-owner session, Cal ID webhooks, short data retention and private Android Web Push are in [docs/admin-cal-id-setup.md](docs/admin-cal-id-setup.md).

## Cal ID configuration

The three verified direct-event URLs are safe defaults in the application, so a clean deployment keeps exact service routing. Create an ignored `.env.local` from `.env.example` only when you need to override them. These are public scheduling URLs, not secrets:

```env
PUBLIC_CAL_ID_BOOKING_URL=https://cal.id/nilima-sawane
PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL=https://cal.id/nilima-sawane/personal-consultation?duration=60
PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL=https://cal.id/nilima-sawane/relationship-consultation?duration=60
PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL=https://cal.id/nilima-sawane/best-date-analysis?duration=30
CALID_API_KEY=calid_your_server_only_key
```

The `PUBLIC_CAL_ID_*` values are public URLs. `CALID_API_KEY` is a server-only secret: keep it in `.env.local` during development and add it to the Vercel project's environment variables for production. Never prefix it with `PUBLIC_` or `VITE_`.

Only HTTPS URLs on the exact `cal.id` or `app.cal.id` hosts are accepted. Credentials, custom ports, and explicitly written ports such as `:443` fail closed. A missing override uses that service's verified direct-event default; an explicitly unsafe override fails closed. If a hosting environment needs different URLs, configure all three `PUBLIC_CAL_ID_*_URL` values in its deployment settings and rebuild. The application selects services only from the URL hash and never reads, displays, stores, decodes, or forwards the future `s` query parameter. The availability proxy accepts only the three known service slugs, limits queries to 42 days, and returns normalized slot timestamps instead of forwarding Cal ID account data.

Never place a Cal ID API key, Razorpay secret, webhook secret, Meta token, or customer birth details in a public environment value.

## Cal ID dashboard checklist

The three event types, descriptions, durations, Google Meet setup, and prices were verified through their live embeds on 8 September 2026.

For visual alignment:

- Set Appearance to **Light** and the mobile default to **Column**.
- Set the primary brand colour to `#684A73`.
- Upload `public/brand/cal-id-logo-600x400.png` as the Cal ID logo.
- Upload `public/brand/icon-512.png` as the Cal ID favicon; it has transparency and is below 1 MB.
- Confirm the public profile no longer exposes unrelated event types.

The homepage hero uses its own responsive calendar instead of an iframe, so there is no nested scroll or mismatched third-party panel. Selecting a time opens the exact Cal ID event and slot in the same tab. The dedicated booking page skips the duplicate calendar and sends each service row directly to its event. A customer-facing **View all available times** fallback remains available in the hero without exposing implementation details. Every destination is validated before it is rendered and fails closed if it is not an approved Cal ID address.

## What to test before launch

Run one controlled booking for each event and verify:

- The event title, duration, INR amount, timezone, and available slots are correct before payment.
- Razorpay is in activated Live Mode with KYC complete; Cal ID does not support Razorpay Test Mode for this flow.
- A successful payment creates exactly one confirmed booking and one Google Meet event in Nilima's connected Google Calendar.
- The booking appears in Nilima's Cal ID mobile dashboard and the attendee receives the correct confirmation.
- A failed or cancelled payment creates no confirmed booking.
- Rescheduling, cancellation, reminders, refunds, and timezone conversion behave according to the approved policy.
- Each homepage calendar date and time opens the correct preselected Cal ID slot on mobile and desktop.
- Each booking-page service row opens its exact event directly in the same tab.
- The same-tab hero fallback opens the correct Cal ID event if the availability API is unavailable.
- The website does not append the future WhatsApp `s` token or any other customer data to the Cal ID destination.

Do not complete a real payment merely to prove the frontend is working. Use a controlled owner-approved transaction and reconcile it in both Razorpay and Cal ID.

## Kundli brand assets

- `public/brand/kundli-mark-master.png` — transparent master.
- `public/brand/cal-id-logo-600x400.png` — Cal ID logo canvas.
- `public/brand/favicon-32.png` — website favicon.
- `public/brand/apple-touch-icon-180.png` — Apple touch icon.
- `public/brand/icon-192.png` and `public/brand/icon-512.png` — square app/Cal ID icons.
- `public/brand/nakshatra-horizontal-dark.png` — primary transparent horizontal logo.
- `public/brand/nakshatra-horizontal-reversed.png` — horizontal logo for dark backgrounds.
- `public/brand/nakshatra-horizontal-monochrome.png` — single-colour horizontal logo.

The source direction and exact final Image Generation prompt are recorded in `docs/brand/kundli-brand-assets.md`.

## WhatsApp Cloud API foundation

The signature-verified WhatsApp webhook endpoint is documented in [docs/whatsapp-cloud-api-setup.md](docs/whatsapp-cloud-api-setup.md). It accepts Meta's callback verification and privacy-safe `messages` events, but does not yet send customer messages or store inbound message content.

Outbound WhatsApp booking automation remains a separate activation phase. The stable future entry point is `/book/?s=<opaque-token>`; this version preserves the parameter in the browser address while never reading, rendering, storing, decoding, or forwarding it. The proposed session, webhook, and ownership boundaries are documented in the approved design specification.

## Evidence and design notes

- [Three-reading design specification](docs/superpowers/specs/2026-09-07-three-reading-services-and-branding-design.md)
- [Three-reading implementation plan](docs/superpowers/plans/2026-09-07-three-reading-services-and-branding.md)
- [Visual QA report](design-qa.md)
- [Local verification record](docs/qa/cal-id-redesign-qa.md)
