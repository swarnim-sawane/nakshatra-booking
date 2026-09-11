# Nakshatra native calendar implementation record

**Goal:** Deliver the approved premium first-party calendar while using Cal ID for availability and final Razorpay booking.

**Architecture:** `AvailabilityCalendar` calls the first-party `/api/cal-id-slots` proxy. The proxy uses `CALID_API_KEY` server-side, resolves the matching Cal ID event type, normalizes its slots, and returns no account or attendee data. Selecting a time navigates to the validated Cal ID event with `duration` and `slot` preselected.

## Completed implementation

- [x] Added safe `buildCalIdCheckoutUrl` behavior with opaque-token stripping.
- [x] Added the service-allowlisted, timezone/range-validated availability handler.
- [x] Added the Vercel serverless adapter and Vite local-development middleware.
- [x] Added Cal ID response-shape normalization, upstream timeout, cache policy, and generic failures.
- [x] Built the responsive native month calendar, available-day selection, time links, trust row, loading, empty, error, retry, and direct fallback states.
- [x] Replaced the Cal ID embed in the landing hero and `/book/`.
- [x] Removed the embed package, iframe CSS, and third-party CSP allowances.
- [x] Added the server-only key example and setup documentation.
- [x] Verified TypeScript, production build, 15 Node tests, 65 Vitest tests, desktop/mobile layout, horizontal overflow, and browser diagnostics.

## Still required from the owner

- [ ] Add a dedicated Cal ID key to `.env.local` as `CALID_API_KEY` for local validation.
- [ ] Add the same server-only variable in the Vercel project before deployment.
- [ ] Re-run the live availability browser test for all three services.
- [ ] Complete and reconcile one owner-approved controlled Razorpay booking, plus failed-payment, cancellation, reschedule, and refund tests.

## Security constraints

- Never prefix the API key with `PUBLIC_` or `VITE_`.
- Never commit the key or paste it into chat, source, logs, screenshots, links, or client storage.
- Never collect attendee, birth, or payment details in Nakshatra; Cal ID owns those inputs.
- Never create or claim a booking from the availability endpoint.
