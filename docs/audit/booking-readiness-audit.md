# Astrology booking website: product and production-readiness audit

Date: 7 September 2026

## Executive verdict

Cal.com is the right scheduling foundation for this business, especially for a single astrologer who needs to manage availability and meetings from a phone. The current website should keep Cal.com as the scheduling source of truth and use hosted Cal.com first; self-hosting would add database, deployment, backup, update, and security work without improving the first customer experience.

The visual shell is coherent, but the booking product is not ready to take real payments. The active browser flow bypasses the server payment-order and verification endpoints, can display success after a Cal.com booking failure, stores customer information in browser storage, and exposes an unauthenticated booking-management API. The mobile stylesheet also hides every primary button, which removes the booking path on phones.

Recommended launch scope: one clearly defined one-to-one consultation, one price, one duration, one cancellation/refund policy, and one reliable Cal.com + Google Calendar + Google Meet workflow.

## Evidence and flow health

| Step | Health | Evidence | Assessment |
|---|---|---|---|
| 1. Discover and trust the astrologer | Needs work | [Landing](01-landing.jpg), [About](06-about.jpg) | Clear hierarchy, but generic branding, placeholder portrait, unsupported trust statistics, and little personal credibility. |
| 2. Choose a consultation | Needs work | [Services](07-services.jpg), [selection modal](02-service-selection.jpg) | The project offers four services although the launch is one-to-one. Demo prices are visible and the modal is long and scroll-heavy. |
| 3. Choose date and time | Needs work | [Calendar](03-calendar.jpg) | The calendar renders, but uses non-semantic date controls, an unexplained date-correction hack, inner scrolling, and an unlabeled five-dot progress indicator. |
| 4. Load live availability | Blocked in local audit | [Local API blocker](04-calendar-api-blocker.jpg) | The static audit server cannot execute Vercel functions. This screenshot is not evidence that the deployed API is broken. Source inspection independently found API-version drift and error-handling risks. |
| 5. Enter details and review | High risk | Source inspection | The form collects substantial personal and birth information and persists it in local storage without a clear consent, retention, or deletion policy. |
| 6. Pay and confirm | Critical | Source inspection | Checkout is launched without a server-created Razorpay order. The client callback is trusted and a customer can see success even when the calendar booking fails. |
| 7. Manage bookings as the astrologer | Critical | Source inspection and local admin page | The custom admin page is not a safe management boundary: client-only login, unauthenticated list/cancel APIs, browser-local fallback data, and no reliable cross-device state. |
| 8. Complete the flow on mobile | Broken | [Mobile landing](05-mobile-landing.jpg) | A global mobile rule hides every primary button, including booking, service, contact, and success actions. |

## What is already good

- Cal.com, Google Calendar, Google Meet, and Razorpay are sensible service choices for an India-based one-to-one consultation business.
- The website has consistent spacing, readable body typography, clear service cards, and a visually coherent dark theme.
- Form labels exist and reduced-motion styling is present.
- The server folder already contains the beginnings of payment-order, verification, availability, booking, and cancellation endpoints. They need consolidation and redesign, not another parallel implementation.

## Critical product and engineering gaps

### P0: Fix before accepting any real payment

1. **The live checkout path does not use the server payment endpoints.** The browser opens Razorpay with a test key and a client-calculated amount, without a Razorpay `order_id`, then treats the client callback as proof of payment. Razorpay requires a server-created order and server-side signature verification before fulfillment: [Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/?preferred-country=IN).
2. **A paid customer can receive a false confirmation.** When Cal.com creation fails, the client invents a fallback booking ID and still shows success. A block-scoped booking variable is also referenced outside its scope, so even a nominal success can break local storage.
3. **Prices are demo values.** The user interface displays ₹1, ₹2, ₹3, and ₹4 while comments contain different intended values. Prices and tax must be defined once on the server; the order API must never trust an amount submitted by the browser.
4. **No durable booking transaction exists.** There is no database record that connects service, slot, customer, Razorpay order/payment, Cal.com booking, retries, and refund state.
5. **Admin access is not secure.** A public client-side password and local-storage login cannot protect customer data. The booking-list and cancellation endpoints have no authentication or authorization.
6. **Mobile booking is unavailable.** The responsive stylesheet hides `.btn--primary` globally at 768px and below.
7. **Current Cal.com integration must be upgraded and re-tested.** The code sends `cal-api-version: 2024-08-13`; the current Create Booking documentation requires `2026-02-25`: [Cal.com Create a booking](https://cal.com/docs/api-reference/v2/bookings/create-a-booking).

### P1: Fix for a trustworthy customer and operator experience

- Replace browser local storage with a minimal server-side booking record. Do not retain full birth data longer than needed.
- Add signed, idempotent Razorpay webhooks. Razorpay documents raw-body signature validation and duplicate detection using `x-razorpay-event-id`: [Validate and test webhooks](https://razorpay.com/docs/webhooks/validate-test/?locale=en-US).
- Add Cal.com webhooks for created, rescheduled, and cancelled bookings, with secret validation: [Cal.com webhooks](https://cal.com/docs/developing/guides/automation/webhooks).
- Add an automatic recovery path when payment succeeds but Cal.com booking fails: retry safely, notify the operator, and issue an idempotent refund when confirmation cannot be completed.
- Show the attendee timezone beside every slot and in review/confirmation. Remove the manual date-offset correction and use UTC plus named timezones end to end.
- Use a dedicated `/book` page instead of a tall modal. Provide labeled steps: Consultation, Time, Details, Review, Payment.
- Make dates semantic buttons, add dialog labels and focus management, remove duplicate element IDs, and test keyboard/screen-reader operation.
- Add privacy, terms, cancellation, rescheduling, no-show, refund, and consultation-scope policies before the payment step.
- Confirm the correct tax treatment with the business's accountant; do not automatically apply 18% to every service until that has been validated.

### P2: Refine the brand and presentation

Purple is not inherently wrong for astrology. The issue is that almost every accent, button, gradient, heading highlight, and decorative element uses the same saturated purple, which makes the site feel like a generic dark SaaS template.

Recommended direction:

- Warm ivory or ink/charcoal as the main surface, muted plum or deep indigo as the primary accent, and a restrained antique-gold or saffron highlight.
- An editorial serif for headings, such as Lora or Fraunces, paired with a calm humanist sans such as Manrope or Source Sans 3. The current Inter-only treatment is clean but generic.
- A real, professionally lit portrait of the astrologer. The current visible “Professional Photo” placeholder is the largest credibility gap on the page.
- The astrologer's real name, approach, experience, languages, location/timezone, credentials or lineage where appropriate, and an honest explanation of what a consultation can and cannot provide.
- One consistent CTA label: “Book a consultation.”
- Real testimonials only, with explicit permission. Remove unsupported numbers such as years, customer counts, ratings, and satisfaction percentages unless evidence exists.
- Replace generic copy with specific, calm language. Avoid mystical over-promising and claims that predictions will certainly come true.

## Recommended first-launch experience

Offer one flagship product: **One-to-one Vedic astrology consultation**. Confirm its exact duration, price, languages, preparation requirements, minimum notice, booking horizon, buffer between calls, cancellation window, and refund policy.

Customer flow:

1. Read the astrologer's real profile, consultation outcome, duration, price, and policy.
2. Select a Cal.com-backed available slot, shown in the customer's timezone.
3. Enter only the minimum information needed for the booking. Explain why birth details are required and how long they are retained.
4. Review appointment, timezone, amount, tax treatment, cancellation/refund policy, and consent.
5. The server creates a durable booking intent and derives the amount from its own service catalog.
6. The server creates a Razorpay order; Checkout receives the returned `order_id`.
7. The server verifies the Razorpay signature and checks that the payment/order is captured/paid for the expected amount and currency.
8. The server rechecks the slot and creates the Cal.com booking idempotently.
9. Only after both sides are confirmed does the website show success, booking ID, calendar invite status, Meet link status, and manage-booking/support actions.
10. If payment succeeds but the slot cannot be booked, the system enters an explicit recovery state, alerts the operator, and refunds rather than displaying success.

Suggested state model:

`slot_selected -> order_created -> payment_verified -> cal_booking_created -> confirmed`

Recovery states:

`payment_succeeded_booking_failed -> retrying -> refund_pending -> refunded`

## How the astrologer should manage the service

Use hosted Cal.com as the scheduling source of truth for the first launch. Connect the astrologer's Google Calendar first, then install Google Meet; Cal.com's documentation states that Google Meet requires Google Calendar to be installed first: [Cal.com conferencing apps](https://cal.com/docs/atoms/conferencing-apps).

Her normal phone workflow should be:

- Cal.com mobile web/dashboard for availability, event type settings, booking details, rescheduling, and cancellation.
- Google Calendar for daily schedule and reminders.
- Google Meet links generated on confirmed Cal.com events.

Do not build a second custom admin product until the core customer transaction is reliable. The existing admin page can later become a narrow business dashboard, but it should read authenticated server-side state and deep-link to Cal.com for scheduling actions.

Cal.com's open-source community edition now lives as Cal.diy. Its own repository warns that self-hosting requires advanced server, database, and security knowledge and recommends managed Cal.com for commercial production use: [Cal.diy repository](https://github.com/calcom/cal.diy). For this single-astrologer launch, managed Cal.com is the practical choice even though open source matters.

## Content still needed from the business

- Astrologer's final brand/name, portrait, biography, credentials, approach, languages, and contact details.
- One-to-one duration, final price, whether the displayed price includes tax, and receipt/invoice requirements.
- Working hours, timezone, minimum booking notice, future booking window, buffers, and personal calendar conflict rules.
- Cancellation, rescheduling, no-show, refund, lateness, privacy, data-retention, and consultation-scope policies.
- Required birth information and justification for each field.
- Real testimonials and permission to publish them.
- Customer support path for payment-success/booking-failure cases.

## Audit limitations

- No real payment was submitted because that would create a financial side effect.
- No real Cal.com booking or cancellation was created.
- The Vercel development server could not complete its network startup during this audit, so a static local server was used for visual inspection. The 404 availability screenshot is therefore an environment blocker, not proof of a deployed defect.
- Details, review, payment, confirmation, and live admin data were assessed from source because the availability step could not be completed locally.
- Contrast ratios and assistive-technology behavior still require formal measurement after the visual system is revised.

