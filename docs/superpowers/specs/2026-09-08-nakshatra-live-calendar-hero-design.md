# Nakshatra native calendar and Cal ID handoff design

Date: 8 September 2026

## Decision

Use a hybrid booking journey. Nakshatra owns service selection and the visible calendar. Cal ID remains the authoritative booking engine for live availability, attendee and birth details, Razorpay payment, confirmation, Google Meet, cancellation, and rescheduling.

The site must not embed or visually imitate the complete Cal ID checkout. After a visitor selects an exact slot, the site opens that service's validated Cal ID event URL in the same tab with only `duration` and `slot` preselected.

## Visual direction

- Match the approved `docs/design/option-3-booking-first-concierge.png` composition: concise practitioner proposition on the left and a real calendar on the right.
- Preserve the Furnics-inspired editorial scale, asymmetric space, fine rules, restrained surfaces, and photography.
- Use Nakshatra's ivory, ink, forest, and ochre palette. Avoid purple, gradients, mystical stock art, glow, dense dashboard cards, and excessive rounding.
- Keep the supplied Nilima portrait and Kundli identity assets as the only personal/brand imagery.

## Calendar experience

- Reuse one `AvailabilityCalendar` component in the landing hero and `/book/`.
- Display service name, duration, price, month navigation, available days, timezone-aware times, Google Meet, and Razorpay context.
- Available dates and times must come from Cal ID; never fabricate availability.
- The page owns scrolling. No iframe, fixed-height third-party viewport, `overflow: scroll`, or `overflow: auto` is allowed.
- Loading, empty, API-error, and invalid-destination states must be deliberate and accessible.
- Keep an always-visible same-tab direct Cal ID fallback.
- On mobile, calendar and times stack in one column and all interactive controls remain touch-friendly.

## API and trust boundary

- Store `CALID_API_KEY` only in server environment configuration. Never expose it through Vite, `PUBLIC_`, frontend code, logs, screenshots, or links.
- Serve availability through first-party `GET /api/cal-id-slots`.
- Allow only the three published service slugs, a valid IANA timezone, valid timestamps, and a maximum 42-day range.
- Resolve the authenticated Cal ID event type by the selected service slug and request its current slots.
- Return only normalized ISO slot timestamps plus service and timezone.
- Use short CDN caching for successful responses and no caching for errors.
- Validate every Cal ID destination as exact HTTPS `cal.id` or `app.cal.id` with no credentials or explicit port.
- Strip unrelated search and hash data when building the slot handoff. Never read or forward the future WhatsApp `s` token.

## Acceptance criteria

- The booking-first hero and `/book/` render the native Nakshatra calendar with no Cal ID iframe.
- Personal Consultation is 60 minutes at ₹1,000; Relationship Consultation is 60 minutes at ₹1,000; Best Date Analysis is 30 minutes at ₹500.
- A selected representative slot builds the exact service URL with `duration` and ISO `slot` only.
- The endpoint fails closed for missing secrets, invalid input, unknown services, and upstream errors.
- The app retains a safe fallback when live availability cannot load.
- TypeScript, build, automated tests, desktop QA, mobile QA, token-isolation checks, and console checks pass.
- Production readiness is conditional until a server-only key is configured and an owner-approved end-to-end payment is reconciled.
