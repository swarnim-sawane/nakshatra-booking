# Nakshatra site-review resolution

Date: 8 September 2026

Source audit: `audit.md`

## Status key

- **Resolved** — changed in the current implementation and covered by code or visual verification.
- **Owner input required** — addressed explicitly, but cannot be truthfully published without a confirmed business detail.
- **Intentionally omitted** — excluded because the audit requires real, permissioned evidence and none has been supplied.

## Core content and fallback

| Audit item | Status | Resolution |
| --- | --- | --- |
| The site prioritised scheduling technology over Nilima and the Kundli | Resolved | Homepage order is now Hero → Meet Nilima → concise readings → consultation experience → customer-first FAQs. Vendor names were removed from the visible calendar and fallback. |
| Fallback introduces an unfamiliar vendor | Resolved | Fallback now says that times are temporarily not showing and that booking remains possible. |
| Fallback does not reassure visitors that appointments can still be booked | Resolved | It explicitly says the visitor can still choose a consultation time securely. |
| `Try again` gives no useful next step | Resolved | The primary action is `See available times`; retry is a secondary `Try loading again` action. |
| `View all times in Cal ID` feels like leaving the brand | Resolved | Customer-facing copy is now `See all available times`; the vendor is not named. |
| Failure copy is too prominent | Resolved | The message is short, calm, and contained inside the time column. |
| The fallback is repeated across pages | Resolved | The calendar and fallback now appear only in the homepage hero. The booking page is a direct service catalogue with no repeated scheduler. |
| Empty month and technical error use the same message | Resolved | Empty months now say Nilima has no remaining appointments that month and direct visitors to the next month or all times. |

## FAQ mismatch and missing trust

| Audit item | Status | Resolution |
| --- | --- | --- |
| FAQs are mainly administrative | Resolved | The first group now answers preparation, the conversation, language, unknown birth time, focused questions, non-frightening guidance, nuskhe, and privacy. |
| Nilima's own approach is missing | Resolved | `Meet Nilima` now explains her eight years of practice, personal preparation, plain-language approach, and careful use of nuskhe. No invented quotation is attributed to her. |
| `Studied before we meet` is not explained | Resolved | The experience section explains the birth details and questions supplied, Kundli preparation, research, and the live discussion. |
| Personalized reading is not distinguished from generic output | Resolved | The biography and FAQ state that Nilima prepares the Kundli herself and that the reading is not an automated report. |
| The 30/60-minute conversation is unclear | Resolved | Duration remains visible on each reading and calendar header; the experience section explains what happens before and during the call. |
| Uncertainty could be handled more responsibly | Resolved | Copy explicitly rules out frightening or absolute predictions and avoids guaranteed outcomes. |
| Notes, remedies, next steps, or follow-up are unclear | Resolved | The site promises only what is verified: practical guidance and traditional nuskhe where appropriate, plus the answers discussed during the live conversation. It does not invent notes or follow-up deliverables. |
| Confidentiality is only implied | Resolved for the website boundary | The privacy section clearly says the Nakshatra frontend does not collect or store birth details, questions, or payment data, and explains why details are shared with Nilima. Provider/astrologer retention duration still needs owner confirmation below. |
| Credibility beyond `8+ years` is missing | Owner input required | The verified experience, personal preparation, languages, and real portrait are prominent. Training, lineage, consultation count, or community/media work will not be invented. |
| Genuine client experiences are missing | Intentionally omitted | No testimonial is published until a client has approved the exact wording and attribution. |

## Highest-impact gaps

| # | Status | Resolution |
| --- | --- | --- |
| 1. VPN availability failure and poor fallback | Resolved in UI | The environment-specific VPN cause remains external; the website now provides one reassuring booking path without exposing implementation details. |
| 2. Footer lacks trust links and business identity | Mostly resolved | Footer now identifies Nilima, languages, and India, and links to privacy, booking policies, consultation scope, and biography. A real pre-booking contact address still needs owner input. |
| 3. Authority is under-explained | Resolved to verified evidence | Eight-plus years, real portrait, personal Kundli preparation, languages, and method are visible. Unsupported credentials and metrics remain excluded. |
| 4. English feels formal or foreign | Resolved | Technical terms such as `synastry` and `composite chart` were replaced by plain language; Hindi and Marathi comfort is stated directly. |
| 5. Policy reassurance is vague | Owner input required | Policies now have a dedicated destination and explain how to manage a booking. Exact reschedule, cancellation, no-show, lateness, and refund windows must be supplied by the owner before launch. |
| 6. Confidentiality and retention are unclear | Partly resolved | The first-party data boundary and purpose are explicit. Exact retention/deletion rules for Nilima and the booking provider require owner confirmation. |

## Excess and repetition

| # | Status | Resolution |
| --- | --- | --- |
| 1. Homepage is too long on mobile | Resolved structurally | Three overlapping sections were removed from the rendered route, leaving four focused homepage sections after the hero. Section spacing and portrait height were reduced. |
| 2. Reading cards contain too much detail | Resolved | Homepage cards now contain one purpose, duration, price, image, and one action. Detailed chart scope and preparation are no longer repeated on every card. |
| 3. Preparation is repeated | Resolved | Birth details appear once in the consultation-experience section and once only when needed in the birth-time FAQ. |
| 4. Booking mechanics are repeated | Resolved | Google Meet and Razorpay are confined to the booking/policies answer and the external checkout; hero facts focus on Nilima. |
| 5. Three adjacent sections overlap | Resolved | `How it works`, `Prepare`, and `Who the readings may help` were replaced by one `What your consultation feels like` section. |
| 6. Portrait is oversized on mobile | Resolved | Mobile crop is capped at 400px high and brings credibility copy forward. |
| 7. Booking page repeats the homepage and selected summary | Resolved | The selected-reading summary was removed. Each booking-page service card now links directly, in the same tab, to its exact event page. |
| 8. Final CTA and footer repeat the same action | Resolved | Footer booking button was removed; the footer now earns its space with identity and trust links. |
| 9. Hero background looks like an accidental watermark | Resolved | No decorative Kundli overlay is rendered. The clean consultation photograph is more visible beneath one restrained ivory wash. |
| 10. Cal ID is named too often | Resolved in customer UI | No visible homepage or booking-page copy names Cal ID. Its domain appears only as the validated link destination. |
| 11. Booking is over-explained while the reading is under-explained | Resolved | The content balance now focuses on preparation, Nilima, language, the conversation, questions, and guidance. |

## Recommended structure and step health

| Audit recommendation | Status |
| --- | --- |
| Header and personalised hero | Resolved |
| Meet Nilima early | Resolved |
| Compact three-reading comparison | Resolved |
| One consultation-experience section | Resolved |
| Genuine client feedback | Intentionally omitted until permissioned content exists |
| Customer-first FAQ plus smaller policies group | Resolved |
| Quiet availability with human fallback | Resolved |
| Final CTA | Resolved |
| Complete footer | Resolved except confirmed pre-booking contact detail |
| Booking page completion state | Resolved; full-width service rows open the exact event directly and the duplicate calendar and summary are gone |

## Accessibility follow-up

The existing skip link, single H1, labelled navigation, native buttons, FAQ disclosure state, disabled dates, same-tab booking links, minimum control sizes, focus treatments, responsive reflow, and reduced-motion rule remain in place. Automated tests cover route structure, focus treatment, contrast tokens, scroll containment, URL validation, and booking handoff. A real screen-reader pass and 200% browser-zoom pass remain launch QA tasks rather than claims made from screenshots.

## Owner inputs still required before public launch

These items are not skipped; publishing invented details would directly violate the audit:

1. A real pre-booking contact email address or WhatsApp business number.
2. Exact rescheduling, cancellation, no-show, lateness, and refund rules.
3. How long Nilima retains birth details and questions, and how a client can request deletion.
4. Optional: verified training/lineage or genuine client feedback with permission.
