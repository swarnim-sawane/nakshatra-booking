# Cal ID hybrid booking QA record

Date: 8 September 2026

Environment: Windows, Vite 7.3.1, React 18.3.1, Codex in-app browser and desktop Edge

Local preview: `http://127.0.0.1:4173/`

## Verified architecture

1. The visitor selects a service, month, date, and exact time in Nakshatra's own interface.
2. `/api/cal-id-slots` fetches availability with the server-only Cal ID key and returns normalized timestamps only.
3. The selected time opens the validated Cal ID event in the Nakshatra booking overlay with `duration` and `slot` preselected; the overlay also provides a separate-tab fallback.
4. Cal ID owns birth/attendee details, Razorpay payment, booking confirmation, Google Meet, cancellation, and rescheduling.

The browser bundle cannot access `CALID_API_KEY`. The proxy allows only the three published service slugs, validates timezone and date bounds, limits each request to 42 days, times out upstream calls, caches successful availability briefly, and does not cache failures.

## Automated gate

| Command | Result |
| --- | --- |
| `npm run check` | Exit 0; TypeScript emitted no diagnostics. |
| `npm test` | Exit 0; production build, Node 23/23, Vitest 79/79. |
| `npm run build` | Exit 0; both landing and booking HTML entries emitted. |

## Browser QA

- Desktop landing hero matches the approved booking-first reference structure.
- Desktop booking page keeps the editorial three-service chooser and a full-width native calendar below it.
- Mobile landing and booking routes have one document scrollbar and no horizontal overflow.
- The native calendar contains no iframe and creates no separate scroll surface.
- Service switching updates the active state, duration, price, preparation, calendar label, and Cal ID fallback URL.
- Browser diagnostics showed no first-party warnings or errors.
- With the server-only `CALID_API_KEY` configured locally, the calendar populated live availability without exposing the key to the browser.

## Production-readiness update — 9 September 2026

Read-only public-page and authenticated API checks verified that Cal ID and the website now agree:

| Reading | Cal ID ID | Duration | Price |
| --- | ---: | ---: | ---: |
| Personal Consultation | 108657 | 30 minutes | ₹1,099 |
| Relationship Consultation (Kundli Milan) | 108655 | 20 minutes | ₹1,499 |
| Muhurat | 108656 | 10 minutes | ₹499 |

All three events were also verified with a 48-hour minimum booking notice, a 15-minute after-event buffer, no manual confirmation requirement and no custom success redirect. These settings were not changed.

The signed webhook foundation is implemented for booking-created, booking-paid, rescheduled and cancelled events. It verifies the raw-body HMAC, filters to the three event types, projects no birth or attendee details, and provides idempotent lifecycle transitions. The production adapter remains deliberately fail-closed because no durable store has been selected.

- The three landing-card actions route to `/book/#personal-consultation`, `/book/#relationship-consultation`, and `/book/#best-date-analysis`.
- Clicking Best Date Analysis updated the browser hash, accessible active state, selected duration/price/preparation, and same-tab secure-booking action.
- The exact event-specific destinations are:
  - `https://cal.id/nakshatra-astrology/personal-consultation?duration=30`
  - `https://cal.id/nakshatra-astrology/relationship-consultation?duration=20`
  - `https://cal.id/nakshatra-astrology/best-date-analysis?duration=10`
- `/book/?s=opaque-test-token#best-date-analysis` kept the token in the visitor-facing URL but did not render it or forward it to Cal ID.
- The booking route renders no iframe. The local page has one scrollbar and the selected Cal ID event opens as a complete page in the same tab.
- Relationship Consultation exposed Asia/Kolkata, Google Meet, ₹1,000, live dates, and time slots.
- A Relationship time slot was selected to open the attendee form. Name, email, notes, guest, Terms, Privacy Policy, Back, and Pay to book controls were visible. No customer data was entered and no booking or payment was submitted.
- Browser diagnostics returned no warning or error whose source URL was the local application.

Cal ID account changes were not made. The exact owner-approved setup is recorded in:

- `docs/operations/cal-id-email-workflows.md`
- `docs/operations/cal-id-webhook-foundation.md`

The communications draft specifies exactly one reminder at 1 hour. There is no 24-hour reminder. Draft policy wording remains unpublished pending Nilima's owner checklist.

## Live test still required

The local Cal ID API key is configured and was used only for read-only event-type verification. No real booking, payment, cancellation or external workflow change was performed.

After adding the key, verify:

- Available days and times match Nilima's connected calendar and Cal ID public event.
- Personal shows 30 minutes and ₹1,099; Relationship shows 20 minutes and ₹1,499; Muhurat shows 10 minutes and ₹499.
- Clicking a time opens the correct event with that slot already selected.
- Attendee/birth-detail fields remain in Cal ID and Razorpay shows the expected amount.
- One controlled successful payment creates exactly one Cal ID booking and one Google Meet event.
- Failed payment, cancellation, rescheduling, refund, reminders, timezone conversion, mobile dashboard access, and confirmation email behave as intended.
- The future WhatsApp `s` token is never rendered or forwarded.
- Exactly one reminder is delivered 1 hour before the consultation, including after a reschedule, and cancellation suppresses it.
- The durable webhook store atomically deduplicates deliveries before the Cal ID subscription is activated.

Do not paste the API key into source code, a `PUBLIC_`/`VITE_` variable, chat, screenshots, or Git. Add it directly to `.env.local` and the Vercel environment settings.
