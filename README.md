# Celestial Guidance booking site

Celestial Guidance is a responsive website for one private, 60-minute astrology consultation. The site explains the session and sends visitors to a dedicated booking page. Cal ID is the intended scheduling boundary; Google Meet and Razorpay are configured inside Cal ID rather than recreated in this frontend.

The current build is intentionally safe when Cal ID is not configured: `/book/` shows a clear setup message and does not display invented availability, price, payment, or confirmation states.

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

The local preview normally starts on the URL printed by Vite. The production build is written to `dist/`.

### Reproducible-install note

This repository does not yet contain a lockfile. Registry access was unavailable while this build was created, so local verification used an existing, gitignored `node_modules` junction and no fresh dependency installation was performed. The dependency versions in `package.json` are exact, but a clean install is not considered verified until registry access returns and a lockfile is generated and reviewed.

## Public configuration

Create an ignored `.env.local` from `.env.example` and replace the example URL:

```env
PUBLIC_CAL_ID_BOOKING_URL=https://cal.id/your-account/your-event
```

`PUBLIC_CAL_ID_BOOKING_URL` is the only public environment value consumed by the application. It must use HTTPS, have no credentials or custom port, and use the exact host `cal.id` or `app.cal.id`. An absent or invalid value keeps the booking page in its safe unconfigured state.

`SITE_URL` remains in `.env.example` as a reserved deployment example; the current Vite application does not consume it.

Never place a Cal ID API key, Razorpay secret, webhook secret, Meta token, or customer birth details in a public environment variable.

## Cal ID dashboard prerequisites

Before a live launch, the owner must configure and verify the external Cal ID event:

- One 60-minute personal event with the owner's real availability, buffers, booking limits, price, and currency.
- Google Calendar connected for conflict checking and Google Meet selected as the meeting location.
- Required attendee questions, consent language, and approved cancellation, rescheduling, refund, privacy, and consultation-scope policies.
- Confirmation and reminder workflows tested with the owner's real business contact details.
- Razorpay connected with an activated, KYC-complete Live Mode account. Do not infer payment acceptance from this local frontend.

After those settings are ready, perform a controlled end-to-end acceptance pass for scheduling, Meet creation, payment, signature/webhook handling, confirmation, rescheduling, cancellation, and refunds before production traffic is enabled.

## Future WhatsApp phase

WhatsApp automation is deliberately outside this release. The stable future entry point is `/book/?s=<opaque-token>`; this version ignores that token and never displays, stores, decodes, or forwards it. The proposed session, webhook, and ownership boundaries are documented in [the approved design specification](docs/superpowers/specs/2026-09-07-cal-id-booking-redesign-design.md#9-future-whatsapp-compatibility).

## Evidence and design notes

- [Design specification](docs/superpowers/specs/2026-09-07-cal-id-booking-redesign-design.md)
- [Implementation plan](docs/superpowers/plans/2026-09-07-cal-id-booking-redesign.md)
- [Visual QA report](design-qa.md)
- [Local verification record](docs/qa/cal-id-redesign-qa.md)
