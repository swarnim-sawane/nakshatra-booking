# Nakshatra Replacement Copy Implementation Plan

> **For Nilima / Nakshatra:** Implement the approved content in `docs/content/2026-09-08-refinement/replacement-copy.md` exactly, without introducing new claims or changing booking behavior.

**Goal:** Replace the remaining generic and duplicated website copy with the approved Nakshatra language across the homepage, booking page, availability states, metadata, navigation, FAQs, and footer.

**Architecture:** Keep the current React/Vite component structure and service-driven rendering. Put shared service and FAQ wording in configuration, keep route-specific copy in its route/component, remove obsolete copy-only components and unused configuration fields, and preserve the existing direct Cal ID booking links.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Node test runner.

---

### Task 1: Lock the approved content behavior in tests

**Files:**
- Modify: `tests/shell.test.tsx`
- Modify: `tests/landing-page.test.tsx`
- Modify: `tests/services.test.ts`
- Modify: `tests/availability-calendar.test.tsx`
- Modify: `tests/book-page.test.tsx`

**Steps:**
1. Update metadata, navigation, hero, service, FAQ, calendar-state, footer, and booking-page expectations to the approved wording.
2. Add assertions that the booking selector heading is rendered only once, each card shows duration once, the removed post-consultation FAQ is absent, and visible Cal ID wording is absent from normal/fallback UI.
3. Run the focused tests and confirm they fail against the old copy.

### Task 2: Replace shared metadata, navigation, service, and FAQ content

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/config/site.ts`
- Modify: `src/config/services.ts`
- Modify: `src/types/service.ts`
- Modify: `src/components/Header.tsx`

**Steps:**
1. Apply the approved homepage and booking-page titles/descriptions.
2. Rename navigation to Meet Nilima, Consultations, What to expect, and FAQs, with Book a consultation as the primary action.
3. Replace the three shared service descriptions and remove unused scope/preparation fields.
4. Replace the FAQ data with the six consultation and two booking-policy answers, removing the post-consultation question.

### Task 3: Replace homepage and calendar component copy

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/MeetNilima.tsx`
- Modify: `src/components/ServiceCards.tsx`
- Modify: `src/components/Preparation.tsx`
- Modify: `src/components/FAQ.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/AvailabilityCalendar.tsx`

**Steps:**
1. Apply the exact approved hero, proof-point, biography, consultation, experience, FAQ, final CTA, and footer wording.
2. Remove the duplicate duration from service cards and use View available times as the service action.
3. Replace technical calendar language with the approved customer-facing loading, selected-date, empty, failure, and unavailable states.
4. Make the privacy FAQ the `#privacy` destination and remove the duplicate standalone privacy copy block.

### Task 4: Simplify the booking page and remove obsolete copy sources

**Files:**
- Modify: `src/pages/BookPage.tsx`
- Modify: `src/components/ServiceSelector.tsx`
- Delete: unused copy-only components confirmed to have no imports

**Steps:**
1. Apply the approved booking metadata and introduction.
2. Remove the selector's second heading block and repeated kicker.
3. Change every booking action to View times and book while retaining exact same-tab event links.
4. Remove unused legacy components/configuration that still contain explicitly retired wording.

### Task 5: Verify the complete refinement

**Files:**
- Modify if needed: `docs/audits/2026-09-08-site-review/design-qa.md`

**Steps:**
1. Run focused tests, then `npm test`, `npm run check`, and `npm run build`.
2. Run `git diff --check` and inspect the scoped diff for copy deviations or accidental unrelated edits.
3. Verify homepage and `/book/` at desktop and mobile widths, including navigation targets, absence of duplicate headings/durations, page scrolling, and direct Cal ID service links.
4. Record the final visual QA result and remaining environment-dependent checks, if any.
