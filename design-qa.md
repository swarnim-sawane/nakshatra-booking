# Design QA — three-reading experience

Date: 8 September 2026

## Comparison target

- Primary live reference: `https://www.starheal.com/`, captured in the Codex in-app browser before implementation and re-captured for the final comparison.
- Existing product direction: `docs/design/option-3-booking-first-concierge.png`.
- Final prototype: `http://127.0.0.1:4173/` and `/book/`.
- The prototype and Starheal were inspected together using the same 1440 × 1024 browser viewport override.
- The older files under `docs/qa/screenshots/` predate the three-reading build and were excluded from this verdict; final visual evidence was captured live in the in-app browser after the current source and brand assets were loaded.

Starheal was used for structural qualities only: a named practitioner, a large editorial headline, strong photography, explicit service choices, and transparent commercial information. Its copy, portrait, credentials, statistics, testimonials, colours, and ornamental identity were not copied.

## Visual verdict

No actionable local P0, P1, or P2 visual finding remains.

The final landing page retains the approved warm paper, ink, forest, and ochre system while gaining the practitioner visibility and service clarity requested by the user. Nilima Sawane is named in the hero, three readings are visible before booking, prices and durations are prominent, the writing avoids invented authority claims, and the long service descriptions remain readable in equal-height editorial cards.

The generated Kundli mark initially became too faint at 32 px. A second Image Generation refinement and transparent export produced a materially darker, simpler mark. It was re-inspected in the 32 px mobile header and the 1440 px desktop header; the square and internal Kundli divisions now remain recognisable without behaving like a generic astrology glyph.

The booking route has a clear three-stage hierarchy: select a reading, review its duration, price, and preparation, then continue through one prominent secure-booking action. The selected reading uses a forest inset rule and tinted surface rather than an exaggerated card animation. The desktop composition stays balanced at two columns; narrow screens stack the selector and summary without losing the active state.

The mixed light-site/dark-calendar composition has been removed. Cal ID now opens as its own full-page experience in the same tab, where it can keep complete control of the calendar, attendee form, and Razorpay flow. The visual transition will be smoother after the external Cal ID Appearance settings are aligned with this site's palette.

## Responsive evidence

The following sizes were inspected with the in-app browser's viewport capability. In every case, document `scrollWidth` equalled `clientWidth`; the 15 px difference from requested width is the browser scrollbar.

| Requested viewport | Captured client width | Landing result | Booking result |
| ---: | ---: | --- | --- |
| 375 × 812 | 360 px | Pass; single-column hero and three services present | Pass; stacked selector, selected summary, and full-width handoff action |
| 768 × 900 | 753 px | Pass; three services present, no horizontal overflow | Pass; active service and direct event preserved |
| 1024 × 900 | 1009 px | Pass; desktop hierarchy remains readable | Pass; selector and summary remain balanced |
| 1440 × 1024 | 1425 px | Pass; compared directly with Starheal | Pass; full desktop selection and handoff composition |

At 375 px, the headline, compact brand mark, Menu, Book action, pricing facts, and forest active state remain legible. At 1440 px, the hero carries the intended premium editorial rhythm and the three service cards align cleanly.

## Interaction and accessibility evidence

- One H1 is present per route; headings, landmarks, lists, definitions, and FAQ disclosures remain semantic.
- All controls retain at least 44 px target sizing and the existing high-contrast focus treatment.
- The service choices are normal hash links and remain keyboard-operable without JavaScript-only semantics.
- Clicking Best Date Analysis changed the hash to `#best-date-analysis`, updated the announced active state to 30 minutes and ₹500, and changed the same-tab action to the exact Best Date event URL.
- `/book/?s=opaque-test-token#best-date-analysis` preserved the future WhatsApp token in the browser address while producing zero body-text matches and forwarding no token to Cal ID.
- The booking route contains no iframe; only the website document scrolls before the visitor chooses to continue.
- The handoff uses ordinary same-tab navigation, so browser Back returns to the website and retains the hash-selected service.
- Local-origin browser diagnostics contained zero warnings or errors. Cal ID's own scripts emitted third-party accessibility and debug-console messages; those are external to this repository and are recorded in the local QA report.

## External launch gates

- Change Cal ID Appearance to Light, default mobile layout to Column, and brand colour to `#2F5D50`.
- Upload `public/brand/cal-id-logo-600x400.png` and `public/brand/icon-512.png` in Cal ID.
- Correct Personal Consultation from the observed ₹500 to ₹1,000.
- Correct Best Date Analysis from the observed ₹1,000 to ₹500.
- Supply a genuine portrait if the landing page should reach Starheal's level of practitioner visibility; no placeholder or synthetic Nilima portrait was added.
- Complete one owner-approved end-to-end payment, Google Meet, confirmation, mobile-dashboard, failure, rescheduling, cancellation, and refund pass.

These gates do not represent unresolved local layout defects. They require Cal ID dashboard access, real business decisions, or a controlled financial transaction.

final result: passed
