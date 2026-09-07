# Celestial Guidance booking site

Celestial Guidance is a responsive, Nilima-led astrology consultation website with three transparent offers:

| Reading | Duration | Price |
| --- | ---: | ---: |
| Personal Consultation | 60 minutes | ₹1,000 |
| Relationship Consultation | 60 minutes | ₹1,000 |
| Best Date Analysis | 30 minutes | ₹500 |

Visitors compare the readings on the landing page, choose one on `/book/`, and continue to that exact Cal ID event for availability, Google Meet, and Razorpay payment. Cal ID remains the scheduling and payment authority; this frontend does not collect birth, attendee, or payment details.

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

### Reproducible-install note

This repository does not yet contain a lockfile. Registry access was unavailable when the initial Vite build was created, so local verification used an existing, gitignored `node_modules` junction. The versions in `package.json` are exact, but a clean install is not considered verified until a lockfile is generated and reviewed.

## Public Cal ID configuration

The three verified direct-event URLs are safe defaults in the application, so a clean deployment keeps exact service routing. Create an ignored `.env.local` from `.env.example` only when you need to override them. These are public scheduling URLs, not secrets:

```env
PUBLIC_CAL_ID_BOOKING_URL=https://cal.id/nilima-sawane
PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL=https://cal.id/nilima-sawane/personal-consultation?duration=60
PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL=https://cal.id/nilima-sawane/relationship-consultation?duration=60
PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL=https://cal.id/nilima-sawane/best-date-analysis?duration=30
```

Only HTTPS URLs on the exact `cal.id` or `app.cal.id` hosts are accepted. Credentials, custom ports, and explicitly written ports such as `:443` fail closed. A missing override uses that service's verified direct-event default; an explicitly unsafe override fails closed. If a hosting environment needs different URLs, configure all three `PUBLIC_CAL_ID_*_URL` values in its deployment settings and rebuild. The application selects services only from the URL hash and never reads, displays, stores, decodes, or forwards the future `s` query parameter.

Never place a Cal ID API key, Razorpay secret, webhook secret, Meta token, or customer birth details in a public environment value.

## Cal ID dashboard checklist

The three event types and their exact direct URLs were verified publicly on 8 September 2026. Two Cal ID amounts do not yet match the approved website catalogue and must be corrected before accepting bookings:

- Personal Consultation currently shows ₹500 in Cal ID; change it to ₹1,000.
- Relationship Consultation shows the intended ₹1,000.
- Best Date Analysis currently shows ₹1,000 in Cal ID; change it to ₹500.

For visual alignment:

- Set Appearance to **Light** and the mobile default to **Column**.
- Set the primary brand colour to `#2F5D50`.
- Upload `public/brand/cal-id-logo-600x400.png` as the Cal ID logo.
- Upload `public/brand/icon-512.png` as the Cal ID favicon; it has transparency and is below 1 MB.
- Confirm the public profile no longer exposes unrelated event types.

The current frontend uses a validated event-specific iframe fallback with `scrolling="no"`, a 960 px desktop viewport, and a 1500 px narrow-screen viewport so the main page owns scrolling. For the final production embed, copy each event's exact code from **Event Types → Edit → Embed → Inline → Get Code**. Do not guess the runtime API or widen the Content Security Policy before those snippets are reviewed.

## What to test before launch

Run one controlled booking for each event and verify:

- The event title, duration, INR amount, timezone, and available slots are correct before payment.
- Razorpay is in activated Live Mode with KYC complete; Cal ID does not support Razorpay Test Mode for this flow.
- A successful payment creates exactly one confirmed booking and one Google Meet event in Nilima's connected Google Calendar.
- The booking appears in Nilima's Cal ID mobile dashboard and the attendee receives the correct confirmation.
- A failed or cancelled payment creates no confirmed booking.
- Rescheduling, cancellation, reminders, refunds, and timezone conversion behave according to the approved policy.
- Mobile and desktop flows show the complete calendar and attendee form without a nested iframe scrollbar.
- The three exact Inline embeds pass responsive QA before replacing the raw iframe fallback.

Do not complete a real payment merely to prove the frontend is working. Use a controlled owner-approved transaction and reconcile it in both Razorpay and Cal ID.

## Kundli brand assets

- `public/brand/kundli-mark-master.png` — transparent master.
- `public/brand/cal-id-logo-600x400.png` — Cal ID logo canvas.
- `public/brand/favicon-32.png` — website favicon.
- `public/brand/apple-touch-icon-180.png` — Apple touch icon.
- `public/brand/icon-192.png` and `public/brand/icon-512.png` — square app/Cal ID icons.

The source direction and exact final Image Generation prompt are recorded in `docs/brand/kundli-brand-assets.md`.

## Future WhatsApp phase

WhatsApp automation is deliberately outside this release. The stable future entry point is `/book/?s=<opaque-token>`; this version preserves the parameter in the browser address while never reading, rendering, storing, decoding, or forwarding it. The proposed session, webhook, and ownership boundaries are documented in the approved design specification.

## Evidence and design notes

- [Three-reading design specification](docs/superpowers/specs/2026-09-07-three-reading-services-and-branding-design.md)
- [Three-reading implementation plan](docs/superpowers/plans/2026-09-07-three-reading-services-and-branding.md)
- [Visual QA report](design-qa.md)
- [Local verification record](docs/qa/cal-id-redesign-qa.md)
