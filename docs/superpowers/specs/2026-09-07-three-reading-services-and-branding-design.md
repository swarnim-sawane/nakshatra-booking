# Three Reading Services and Cal ID Branding Design

Date: 7 September 2026

## Purpose

Evolve Celestial Guidance from an anonymous single-consultation page into a personal, Nilima-led astrology practice with three clear services, transparent prices, a visually consistent booking journey, and a reusable Kundli brand mark.

## Approved source material

- The user's service names, prices, durations, and descriptions are the content authority.
- The supplied Kundli-on-paper image is the visual reference for the brand mark.
- Starheal is a structural reference for practitioner visibility, editorial typography, direct service descriptions, and transparent pricing. Its text, credentials, testimonials, colours, and claims must not be copied.
- The existing warm paper, ink, forest, and ochre design remains the product's visual foundation.

## Service catalogue

### Personal Consultation

- Duration: 60 minutes.
- Price: ₹1,000.
- Purpose: a one-to-one session for clarity, direction, and a deeper understanding of the client's current life context.
- Scope: the birth chart, natural tendencies, strengths, recurring patterns, and current themes. Upcoming transits may be considered with a focus on the next year.
- Preparation: one person's birth date, exact birth time when known, birth place, and the main question or situation.

### Relationship Consultation

- Duration: 60 minutes.
- Price: ₹1,000.
- Purpose: a clearer understanding of a relationship without deterministic compatibility scores or soulmate claims.
- Scope: both birth charts, each person's natural tendencies and emotional needs, synastry, and the composite chart.
- Preparation: both people's birth dates, exact birth times when known, birth places, and one relationship question.

### Best Date Analysis

- Duration: 30 minutes.
- Price: ₹500.
- Purpose: choose supportive timing for an important event such as a marriage, business launch, contract, or major move.
- Scope: the client's birth chart and relevant upcoming transits applied to the stated goal.
- Preparation: the client's birth details, event type, preferred date range, location, and constraints.

## Voice and trust

- Lead with: “Your birth chart, understood in the context of your life.”
- Name Nilima Sawane in the hero and throughout the booking journey.
- Use first-person language only where it is directly supported by the user's supplied service descriptions.
- Add a “Meet Nilima” section that describes a calm, non-judgmental, explanatory consultation philosophy without inventing training, years of experience, qualifications, languages, testimonials, or guaranteed outcomes.
- Do not add a portrait placeholder. The current editorial Kundli imagery may accompany the section until a real portrait is supplied.
- Show prices before the scheduler. Replace operational phrases such as “Razorpay in Cal ID” with “Secure online payment through Razorpay.”
- Retain the boundary that astrology is reflective guidance, not medical, legal, financial, or mental-health advice.

## Landing-page structure

1. Personal hero naming Nilima and the nature of the work.
2. Three reading cards with duration, price, preparation, and specific booking actions.
3. Meet Nilima and her consultation approach.
4. What happens before, during, and after a reading.
5. Who the readings may help, alongside the professional-advice boundary.
6. Expanded visitor-centred FAQ.
7. Final service-selection action.

No testimonial is displayed until the user supplies permissioned, genuine client feedback.

## Booking architecture

- `/book/` remains the stable booking entry point and `/book/?s=<opaque-token>` remains reserved for the later WhatsApp phase.
- Service selection uses URL hash values, never query parameters: `#personal-consultation`, `#relationship-consultation`, and `#best-date-analysis`.
- The application may read only the hash for service selection. It must not read, store, display, decode, or forward the `s` query parameter.
- Three optional public environment values hold validated event-specific Cal ID URLs. Until those URLs exist, every service falls back to the validated public profile URL.
- The page repeats the selected service's name, duration, price, and preparation before the scheduler.
- The current raw profile iframe is treated as a temporary local-review fallback. Its viewport is made tall enough for the observed profile/calendar/form states and internal scrolling is suppressed so the main page owns scrolling.
- Production should switch each service to Cal ID's official Inline embed using the exact code copied from each event's Embed tab. The runtime API and CSP origins must not be guessed. If the official embed cannot pass responsive QA, the safe fallback is the exact event link in a new tab.
- Cal ID remains the authority for availability, conflict checking, Google Meet, Razorpay, confirmation, rescheduling, cancellation, and refunds.

## Cal ID appearance settings

- Booking-page theme: Light.
- Default mobile layout: Column.
- Primary brand colour: `#2F5D50`.
- Paper reference: `#F7F3EA`.
- Surface reference: `#FFFDF8`.
- Ink reference: `#1C1915`.
- Decorative ochre: `#A97835`.
- Remove or hide the unrelated Partnership, Investor, and Product events before launch.

## Kundli brand pack

Generate one original transparent-background Kundli mark based on the supplied hand-drawn chart geometry, warm materiality, and restrained linework. It must avoid purple gradients, zodiac clip art, stars, moons, text, watermarks, and generic “AI mystical” styling.

Deliver:

- `kundli-mark-master.png` — transparent master.
- `cal-id-logo-600x400.png` — transparent Cal ID logo canvas.
- `favicon-32.png` — website favicon.
- `apple-touch-icon-180.png`.
- `icon-192.png`.
- `icon-512.png` — also suitable as the Cal ID favicon if under 1 MB.

The website uses the generated mark as its favicon and compact brand symbol. Cal ID uses the 600 × 400 PNG and the compressed square icon.

## External information still required

- The direct Cal ID URL and copied Inline Embed code for each of the three created event types.
- Nilima's genuine portrait, method/tradition, training or mentorship, experience, and spoken languages if those should be stated.
- Whether any chart copy, recording, notes, written date recommendation, or post-call summary is included.
- Approved privacy, cancellation, rescheduling, and refund policies.
- Permissioned testimonials, if any.

## Acceptance criteria

- All three services and exact prices/durations appear before booking.
- Every service action selects the matching booking context.
- The active service is keyboard-operable, visually obvious, and announced accessibly.
- The current public-profile fallback has no visible nested scrollbar in the tested desktop and mobile states.
- The exact event-specific Inline embeds replace the fallback before production launch.
- A completed controlled booking shows the correct amount, creates one Google Meet event, and appears in Nilima's Cal ID mobile dashboard and Google Calendar.
- Failed or cancelled payment creates no confirmed booking.
- The Kundli assets are visually inspected at full size and favicon size, have the expected dimensions, and remain legible on light and dark surfaces.
- The final UI passes responsive checks at 375, 768, 1024, and 1440 CSS pixels, keyboard navigation, focus visibility, contrast, and horizontal-overflow checks.

