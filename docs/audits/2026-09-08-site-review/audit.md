# Nakshatra website audit

Date: 8 September 2026

## Audit scope

Read-only review of the current homepage and booking page at desktop (1440 x 900) and mobile (390 x 844). The primary user goal is to understand Nilima's service, trust her, choose a reading, and reach a working consultation time without confusion.

## Overall verdict

The visual identity is credible, but the content hierarchy is not yet customer-first. Nakshatra currently explains scheduling technology, payment mechanics, preparation, and fallback states more often than it explains Nilima's approach, the meaning of a Kundli reading, or why a new customer should trust the experience. The site should feel like a calm introduction to an astrologer, not a polished interface wrapped around Cal ID.

## Core content problem

The main character should be **Nilima and the customer's Kundli**. At present, Cal ID, Razorpay, Google Meet, availability errors, and booking instructions receive disproportionate attention. These details are useful at the moment of payment, but they should not define the brand or dominate the homepage.

A better content balance would be:

- roughly 60–70% trust, Nilima's approach, personalized Kundli preparation, and the experience of the consultation;
- roughly 20–30% choosing the right reading;
- roughly 10% scheduling and payment logistics.

Cal ID should operate quietly in the background. Most visitors neither know nor care which scheduling platform is being used. Customer-facing actions should say `Choose a time`, `See available times`, or `Continue to secure booking`, while the vendor name appears only when a visitor is about to leave Nakshatra for the external booking page.

## Error and fallback copy

The existing fallback language is technically accurate but largely useless to a customer. Phrases such as `We couldn't load live times just now`, `Try again`, `View all times in Cal ID`, and `continue to Nilima's secure Cal ID page` describe the system rather than helping the person complete their goal.

Problems with the current fallback experience:

1. It introduces an unfamiliar company name at the exact moment trust is already fragile.
2. It does not clearly say whether appointments still exist or whether booking remains possible.
3. `Try again` offers no explanation of what will change.
4. `View all times in Cal ID` sounds like leaving Nakshatra for a different service.
5. The failure message is prominent enough to become one of the first things visitors associate with the brand.
6. The same fallback appears on both the homepage and booking page, multiplying the sense that the service is unavailable.

The customer-facing fallback should acknowledge the interruption once, reassure the visitor that booking is still possible, and offer one clear action. For example:

> Available times are not showing here right now. You can still choose a consultation time securely.

Primary action: `See available times`

Secondary action, only if useful: `Try loading again`

For a genuinely empty month, use a different message:

> Nilima has no remaining appointments this month. Please check the next month for available times.

Do not mention an API, VPN, integration, platform failure, or troubleshooting detail in customer copy. Those belong in monitoring and diagnostics, not in the consultation experience.

## FAQ content mismatch

The current FAQs are mostly administrative and several answers repeat material already shown elsewhere. They explain birth time, preparation, payment handling, cancellation, reading selection, and professional-advice boundaries. Those subjects are valid, but they do not answer the deeper questions a first-time customer has before trusting an astrologer.

The FAQs should primarily remove emotional uncertainty:

- Will the reading be prepared specifically for me?
- What happens during the consultation?
- Can I speak in Hindi or Marathi?
- What if I do not know my exact birth time?
- Can I focus on one personal situation or decision?
- Will the consultation include frightening or absolute predictions?
- Are my birth details and questions kept private?
- Will I receive practical guidance or traditional nuskhe?
- What happens after the consultation?

Booking, payment, rescheduling, cancellation, and refund information should remain available, but exact policies belong in a short `Booking and policies` group rather than defining the entire FAQ section. Cal ID should not appear in FAQ answers unless there is an unavoidable platform-specific instruction.

## Trust and meaning that are currently missing

- Nilima's own voice: why she practises astrology and how she approaches sensitive questions.
- What `studied before we meet` actually involves when she prepares a Janam Kundli.
- How a personalized reading differs from a generic horoscope or automated report.
- What a customer can expect during the 30- or 60-minute conversation.
- How uncertainty is handled without fear, deterministic claims, or guaranteed outcomes.
- Whether the customer receives notes, remedies, next steps, or any follow-up after the call.
- A clear confidentiality statement for birth details and personal questions.
- Verifiable credibility and genuine client experiences, with permission.

This does not require more total copy. It requires replacing operational copy with fewer, more meaningful sentences.

## What is working

- The brand feels calm, personal, and more like a considered practice than a generic horoscope portal.
- Pricing, duration, languages, meeting format, and payment provider are visible before booking.
- The copy avoids guaranteed outcomes and includes a responsible professional-advice boundary.
- Nilima's real photograph and first-person service preparation are the strongest trust elements.
- The reading selector, mobile menu, and FAQ disclosure expose clear interactive states.
- Desktop and mobile layouts reflow without visible horizontal overflow.

## Highest-impact gaps

1. **Live availability did not work while the review laptop was connected to a VPN, but worked normally after disconnecting from the VPN.** This appears environment-specific rather than a general site failure. However, the customer-facing fallback remains a serious content problem: it exposes Cal ID, does not reassure the visitor that appointments can still be booked, and makes the failure more memorable than the astrologer.
2. **The footer lacks practical trust links.** There is no visible contact route, privacy notice, terms, cancellation/refund policy, or business identity beyond Nilima's name.
3. **Nilima's authority is under-explained.** `8+ years of practice` is useful but incomplete. Add only verifiable training, lineage, professional focus, consultation count, media/community work, or genuine client feedback.
4. **The site promises Hindi and Marathi consultations but speaks only in polished English.** Terms such as `synastry`, `composite chart`, and `supportive timing` can feel formal or foreign. Plain-language Hindi/Marathi support or a language choice would make the experience feel more personal and less like translated marketing copy.
5. **Policy reassurance is vague.** The cancellation FAQ sends the visitor to terms presented later instead of stating the actual reschedule, cancellation, no-show, and refund rules before payment.
6. **Confidentiality is implied, not promised clearly.** Explain how birth details and questions are used, who receives them, and how long they are retained, using only confirmed practices.

## What is too much

1. **The homepage is too long on mobile.** It measured 10,231 px, approximately twelve 844 px screens.
2. **The three readings carry too much detail before the visitor has chosen one.** Each card repeats purpose, duration, price, chart scope, preparation, and a CTA. Keep a compact comparison on the homepage and place full details after selection.
3. **Preparation is repeated.** Birth details appear in service cards, the preparation section, FAQs, and the selected-reading summary.
4. **Booking mechanics are repeated.** Google Meet, Razorpay, Cal ID, duration, and price recur across the hero, service area, process, booking introduction, selected summary, and calendar footer.
5. **Three adjacent sections overlap in purpose.** `How it works`, `Prepare for your session`, and `Who the readings may help` can become one concise `Before you book` section.
6. **The portrait is oversized on mobile.** It consumes most of a screen before the credibility copy appears. A shorter crop would keep Nilima visible while bringing her experience and approach above the fold.
7. **The booking page repeats the homepage.** The service list plus a separate selected-reading summary delays the calendar. On mobile, the chosen service can be summarized inside the calendar header instead.
8. **The final CTA and footer repeat the same booking action without adding new reassurance.** The footer should earn its space with contact and policy information.
9. **The hero background is neither fully photographic nor fully clean.** The faint chart/line treatment can read as an accidental watermark. Use a more visible, cleanly cropped photograph or a plain ivory background; avoid layering both ideas.
10. **Cal ID is named far too often.** It appears in the calendar fallback, FAQ answers, preparation guidance, booking handoff, and supporting explanations. This weakens Nakshatra's identity and makes the booking vendor feel more important than Nilima.
11. **The website over-explains how booking works but under-explains how the astrology feels.** Operational clarity is useful, but the customer also needs warmth, personal relevance, and a clear picture of the consultation itself.

## Elegance standard

Elegance here should come from restraint, not decoration or more copy:

- one clear idea per section;
- one primary action at each decision point;
- short, confident sentences in a warm human voice;
- generous space around meaningful content;
- platform and payment names shown only when necessary;
- no repeated reassurance that does not add new information;
- no mystical exaggeration, fear, or guaranteed outcomes;
- every sentence should either build trust, explain the personalized experience, or help the visitor take the next step.

## Recommended homepage structure

1. Header
2. Hero focused on personalized Kundli preparation, with one primary booking action
3. Meet Nilima early, with her approach, languages, and verifiable credibility
4. Compact three-reading comparison
5. `What your consultation feels like`: preparation, conversation, guidance, and next steps
6. Genuine client feedback, only when permission and wording are real
7. Customer-first FAQs, followed by a smaller booking-and-policies group
8. A quiet availability and booking section with human fallback copy
9. Final CTA
10. Complete footer with contact, privacy, terms, cancellation/refund, and business details

## Step health

1. **Header and hero — good with polish needed.** Clear brand and proposition; background treatment is ambiguous.
2. **Homepage availability — poor.** The visible fallback is written around the scheduling system instead of the visitor's next step.
3. **Reading comparison — understandable but excessive.** Clear choices, too much repeated detail.
4. **Meet Nilima — promising but incomplete.** Human and credible; needs stronger verifiable proof and a shorter mobile image.
5. **Process and preparation — individually clear, collectively repetitive.** Merge and shorten.
6. **Guidance boundary and FAQs — mismatched.** The disclosure interaction works, but the questions prioritize administration over trust, personalization, privacy, and the actual reading experience.
7. **Final CTA and footer — visually clear but under-informative.** Add practical trust links instead of another repeated sales message.
8. **Booking page — clear selection, weak completion state.** The selector works, but duplicate summaries and repeated Cal ID language delay a simple, human booking decision.

## Accessibility observations and limits

- The page exposes one H1 per route, meaningful section headings, a skip link, labelled navigation, expanded/collapsed FAQ state, and disabled calendar dates.
- The mobile menu and FAQ worked in the browser accessibility tree.
- Screenshots alone cannot prove complete keyboard order, screen-reader announcements, zoom resilience, or WCAG compliance. These require a dedicated interaction and assistive-technology pass.

## Evidence

- `01-mobile-hero.png`
- `02-mobile-readings.png`
- `03-mobile-about.png`
- `04-mobile-process.png`
- `05-mobile-prepare.png`
- `06-mobile-faq.png`
- `07-mobile-cta-footer.png`
- `08-mobile-booking-top.png`
- `09-mobile-booking-selection.png`
- `10-mobile-booking-calendar.png`
- `11-desktop-hero.png`
- `12-desktop-booking.png`
- `13-mobile-faq-open.png`
- `14-mobile-menu-open.png`

The browser was restored to its normal viewport after capture. No production or website code was changed during this audit.
