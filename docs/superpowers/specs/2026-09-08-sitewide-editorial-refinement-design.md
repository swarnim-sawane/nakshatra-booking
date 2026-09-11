# Nakshatra site-wide editorial refinement design

Date: 8 September 2026

## Decision

Refine the existing Nakshatra site as one quiet editorial system rather than treating each screenshot as an isolated CSS problem. The approved direction uses restrained typography, real photographic assets, deliberate buttons, subtle viewport-triggered motion, first-person practitioner copy, and complete booking error states.

This specification supersedes earlier visual guidance wherever it conflicts with the current approved ivory, ink, ochre and pale-lilac direction. Cal ID remains the booking and payment authority. Nakshatra continues to display live availability through its first-party endpoint and hands the visitor to the relevant Cal ID event page to complete details and Razorpay payment.

## Goals

- Make hierarchy and alignment feel consistent across the landing page, booking page, calendar and legal anchors.
- Keep the interface calm, premium and human rather than oversized, overly decorative or template-like.
- Let Nilima speak in the first person in the About section.
- Make every booking action visually unambiguous.
- Give loading, empty and failed calendar states the same design quality as the successful state.
- Add restrained motion without harming usability, performance or reduced-motion accessibility.
- Provide a deliberate 404 experience.

## Non-goals

- Do not redesign the Cal ID checkout or move payment into Nakshatra.
- Do not add new consultation services, guarantees, credentials, testimonials or outcome claims.
- Do not invent Nilima's social handles. Temporary URLs must be isolated in configuration for easy replacement.
- Do not add parallax-heavy scenes, continuously moving ornaments, autoplay media or mystical stock graphics.
- Do not change the existing pricing, duration, Google Meet or Razorpay flow.

## Visual hierarchy

### Type roles

Use the current premium display and body families, but reduce the gaps between type roles:

- Eyebrow or section label: `0.76rem` to `0.82rem`, with moderate tracking. It must remain legible and must not look like metadata beside an enormous headline.
- Primary page/hero heading: responsive and editorial, but capped so it fits the intended viewport. Preserve the current hero composition.
- Standard section heading: approximately `clamp(2.25rem, 3.6vw, 3.5rem)` on desktop and `clamp(2rem, 9vw, 2.7rem)` on mobile. Prefer natural title case over full uppercase for long phrases.
- Card title: approximately `clamp(1.7rem, 2.1vw, 2.25rem)`, with consistent line height across all service cards.
- Body copy: `1rem` to `1.1rem`, line height around `1.65`; supporting card copy must not visually compete with its heading.
- Small metadata: no smaller than `0.75rem` except purely decorative microcopy.

Section headings, card titles and copy widths must share a common rhythm. Avoid a tiny label followed by a headline that occupies most of the screen, as shown in the supplied consultation screenshot.

### Spacing and alignment

- Align section labels, headings and lead paragraphs to the same left edge.
- Use a predictable vertical sequence: label, heading, lead, content.
- Normalize service-card content so image heights, title blocks, fact rows and CTA positions align across the row.
- Keep Experience and Languages in a two-column row on mobile. They may stack only at an extremely narrow width where two readable columns no longer fit.
- Preserve comfortable whitespace without leaving large accidental blank bands between sections.

### Colour and links

- Preserve the ivory paper, ink, warm ochre and very pale lilac palette.
- Lilac is an accent surface or focus colour, not the default colour for every link.
- All prominent in-content actions must use button styling. This includes consultation exploration, calendar continuation, retry, and final booking actions.
- Header navigation and footer legal/navigation groups remain semantically conventional text links, but use neutral ink/muted colours rather than purple. They receive clear hover and focus states.
- Real buttons and button-styled links must share height, padding, font treatment and focus rings.

## Motion system

Install the current `motion` package and import React APIs from `motion/react`.

- Wrap the app in `MotionConfig` with `reducedMotion="user"`.
- Add a small reusable reveal primitive for opacity plus `12px` to `18px` of vertical travel, roughly `400ms` to `550ms`, running once when a section enters the viewport.
- Stagger consultation cards by about `60ms` to `80ms` rather than animating them simultaneously.
- Reveal Nilima's portrait with a restrained rise and scale settling from roughly `1.025` to `1`. The animation begins as the About section enters view; it is not a continuously scrubbed parallax effect.
- Reveal the portrait caption slightly after the image so Nilima's identity feels intentional.
- Use short hover transitions for buttons and cards, without bounce or exaggerated lift.
- Disable non-essential transforms when reduced motion is requested. Content must never depend on animation to become readable.

## Header, footer and brand consistency

- Keep the existing Nakshatra wordmark and real Kundli icon asset.
- Add the real Instagram and Facebook icons from the existing icon library to both header and footer.
- Store social URLs in one configuration object. Use temporary mock profile URLs for now and label them clearly in source code so they can be replaced without touching components.
- Do not display “Coming soon” in the interface.
- Social links open in a new tab with safe `rel` attributes and accessible names.
- On smaller header layouts, keep the social icons compact and avoid pushing the primary booking action off-screen; they may sit inside the mobile menu.
- Reuse the Nakshatra mark sparingly as a small section signature or beside the final booking invitation. Do not turn it into a repeated background pattern.

Temporary configuration values:

- Instagram: `https://www.instagram.com/nakshatra.placeholder/`
- Facebook: `https://www.facebook.com/nakshatra.placeholder/`

## Meet Nilima section

The About section must read in Nilima's first-person voice and use only details already verified by the user.

Approved copy direction:

**Eyebrow:** Meet Nilima

**Heading:** I study your Kundli before we speak.

**Experience line:** 8+ years of Kundli reading · Consultations in Hindi and Marathi

**Body:**

> I have been reading Kundlis for more than eight years. Before every consultation, I prepare the chart myself and study the question or situation you have shared, so our time is not spent starting from the beginning.

> During the call, I explain the patterns I see in clear language and leave room for you to question, reflect and go deeper. Where it is appropriate, I may also suggest practical steps or traditional nuskhe—always as guidance, never as a promise.

**Language note:** You can speak with me in Hindi or Marathi—whichever feels most natural.

The portrait caption must present the full name in an elegant italic display style:

- `Nilima Sawane`
- `Kundli astrologer · Hindi and Marathi consultations`

Use a proper button for `View consultations` rather than a purple text link.

## Calendar states

### Success

Retain the working custom calendar, available dates, time selection and secure Cal ID handoff. Keep its typography aligned with the corrected site hierarchy.

### Loading

Keep a calm skeleton or progress treatment with an accessible loading label. Avoid layout shift.

### Empty month

The calendar remains visible because it is working. Explain that no times are currently available in the selected month and provide button actions to check the next month or continue to the full Cal ID booking page.

### API or network error

Do not leave a dead month grid visible. Replace the entire calendar body and footer with a composed alternative panel in the same card:

- Nakshatra mark.
- Heading: `Live availability could not be loaded.`
- Explanation: `You can still continue securely to Nilima's booking page and choose a time there.`
- Primary button-styled link: `Continue to secure booking`.
- Secondary button: `Try loading times again`.
- Quiet reassurance: `Your consultation details and payment are completed securely through Cal ID.`

The service name, duration and price may remain in the card header so the visitor retains context. There must be no empty calendar grid, misleading disabled dates, redundant footer link or purple underlined retry action in the error state.

### Missing or invalid booking destination

Show a full-card unavailable state without an external handoff. Ask the visitor to refresh or return to the consultations. Do not create or guess a booking URL.

## Mature FAQ content

Use plain, adult language. Avoid overly basic reassurance, mystical certainty, deterministic claims and repetitive explanations.

### About the consultation

1. **What kind of question is suitable for a consultation?**  
   A focused question about a decision, recurring pattern, relationship, period of change or important date gives Nilima useful context. You do not need to know which astrological technique applies.

2. **What can a Kundli reading clarify—and what can it not decide for me?**  
   A reading can help you understand patterns, timing and the considerations around a choice. It does not remove your agency, replace professional medical, legal or financial advice, or guarantee a particular outcome.

3. **What if my birth time is uncertain?**  
   Share the most accurate information you have and say clearly when the time is uncertain. Nilima will explain which parts of the reading can be approached responsibly and which conclusions would be unreliable.

4. **How does Nilima prepare before we speak?**  
   Nilima prepares your Janam Kundli herself and reviews the question or situation submitted with the booking. This allows the consultation to begin with context rather than spending most of the call gathering background.

5. **Can I discuss a sensitive personal or relationship matter privately?**  
   Yes. Share only what is relevant and what you are comfortable discussing. Birth details and questions are submitted through the secure booking flow and used to prepare and conduct the consultation.

6. **Will the consultation tell me exactly what will happen?**  
   No responsible reading can promise a fixed future. Nilima explains the tendencies and timing she sees, including uncertainty, so you can make a more considered decision.

7. **Are traditional remedies or nuskhe guaranteed to work?**  
   No. Where appropriate, Nilima may suggest a traditional nuska or practical step as guidance. It is not presented as a guaranteed result or a substitute for professional care.

### Booking and payment

8. **What happens after I choose a consultation time?**  
   You continue to the secure Cal ID booking page, provide the requested birth details and questions, and complete payment through Razorpay. The confirmed booking includes the online meeting information.

9. **How do I change or cancel a booking?**  
   Use the booking-management link in the confirmation email. Any cancellation or refund follows the terms shown before payment.

10. **What should I do if live times do not load on this website?**  
    Use the secure booking button shown in the calendar panel. It opens the same consultation on Cal ID, where you can view current availability and continue normally.

## 404 page

- Recognize only the home and booking routes as valid app pages. Unknown paths render a dedicated Not Found page rather than silently displaying the home page.
- Use the standard header and footer so recovery options are familiar.
- Use the Nakshatra mark, a concise `Page not found` heading and a calm explanation.
- Provide two button actions: `Return home` and `View consultations`.
- Add a real `404.html` build entry so static hosting can serve the design for unknown routes while local Vite fallback still resolves through the app router.
- Set a specific page title and description for the 404 state.

## Accessibility and interaction requirements

- Preserve semantic headings and landmarks.
- Use links for navigation and buttons for in-place actions such as retry.
- Maintain visible keyboard focus, `44px`-class touch targets and sufficient contrast.
- Give icon-only social controls accessible names.
- Ensure decorative brand marks use empty alternative text and are hidden from assistive technology.
- Keep all content usable with JavaScript motion disabled or reduced.
- Do not trap scrolling or add nested page scroll containers.

## Implementation outline

- Add `motion` and a small shared reveal component/provider.
- Centralize social profile configuration.
- Update Header, Footer, MeetNilima, ServiceCards, FAQ and final booking actions.
- Rework AvailabilityCalendar error rendering before the normal calendar body.
- Add NotFound page, route kind, metadata, 404 document input and styles.
- Normalize typography, buttons, spacing and responsive rules across `tokens.css`, `global.css`, `landing.css` and calendar styles.
- Update component, routing, calendar and content tests before implementation, then make them pass.
- Keep the local preview running for review.

## Acceptance criteria

- Section labels, headings, body copy and service cards form a consistent hierarchy at desktop and mobile widths.
- Experience and Languages remain side-by-side in the supplied mobile state.
- No prominent purple underlined action links remain in page content or the calendar fallback.
- Nilima's About copy is first person, her full name is presented professionally below the portrait, and the portrait animates subtly once on entry.
- Instagram and Facebook use real icons in header and footer, backed by centralized mock URLs with no “Coming soon” copy.
- Calendar API failure replaces the dead grid with the approved alternative panel.
- Mature FAQs render the approved questions and answers.
- Unknown routes render the designed 404 experience locally and in the production build.
- Motion respects reduced-motion preference and does not cause layout shift or block interaction.
- TypeScript, build, automated tests, desktop visual QA, mobile visual QA, keyboard checks and console checks pass.
- Product Design visual QA compares the supplied reference/problem screenshots with matching local viewport captures and records a passing `design-qa.md`.
