# Three Reading Services and Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Nilima-led service storytelling, three priced readings, a service-aware booking page, a no-nested-scroll Cal ID fallback, and a complete Kundli branding pack.

**Architecture:** A typed service catalogue is the single source for landing and booking copy. Hash-based service selection preserves the future WhatsApp query boundary. Validated event-specific Cal ID URLs are optional until the owner creates them; the existing public profile remains the local fallback, while production will use the official Inline snippets copied from Cal ID.

**Tech Stack:** React 18, TypeScript, Vite 7, Vitest, semantic HTML/CSS, Lucide React, Cal ID, built-in Image Generation.

**Spec:** `docs/superpowers/specs/2026-09-07-three-reading-services-and-branding-design.md`

## Global Constraints

- Personal Consultation: 60 minutes, ₹1,000.
- Relationship Consultation: 60 minutes, ₹1,000.
- Best Date Analysis: 30 minutes, ₹500.
- Never invent Nilima's credentials, experience, languages, portrait, testimonials, or deliverables.
- Never read or forward the `s` query parameter.
- Only validated HTTPS `cal.id` or `app.cal.id` URLs may enter an embed or external link.
- Use the existing paper/ink/forest/ochre design system and avoid purple mystical styling.
- Keep source files below 500 lines and use test-first changes.

---

### Task 1: Typed service catalogue and routing boundary

**Files:**
- Create: `src/config/services.ts`
- Modify: `src/config/scheduling.ts`
- Modify: `.env.example`
- Test: `tests/services.test.ts`
- Test: `tests/scheduling.test.ts`

**Interfaces:**
- Produces: `ServiceSlug`, `ConsultationService`, `consultationServices`, `getServiceByHash(hash: string)`, and `getCalIdUrlForService(service, env): URL | null`.
- Consumes: `parseCalIdBookingUrl(value: string): URL | null` and the public profile fallback.

- [ ] **Step 1: Write failing tests** for the exact three service records, prices, durations, hash selection, invalid hash fallback, valid event-specific URLs, and invalid URL rejection.
- [ ] **Step 2: Run `npx vitest run tests/services.test.ts tests/scheduling.test.ts`** and confirm failure because the service module does not exist.
- [ ] **Step 3: Implement the typed catalogue and URL resolver** with exact user-approved copy and no access to `window.location.search`.
- [ ] **Step 4: Add the three optional public event URL keys to `.env.example`** without inventing slugs or secrets.
- [ ] **Step 5: Re-run the focused tests** and require all to pass.
- [ ] **Step 6: Commit** with `feat(services): add three reading catalogue`.

### Task 2: Personal landing story and service cards

**Files:**
- Create: `src/components/ServiceCards.tsx`
- Create: `src/components/MeetNilima.tsx`
- Modify: `src/pages/LandingPage.tsx` or the existing landing composition in `src/App.tsx`
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/ConsultationOverview.tsx`
- Modify: `src/config/site.ts`
- Modify: `src/styles/landing.css`
- Test: `tests/landing-page.test.tsx`

**Interfaces:**
- Consumes: `consultationServices` and hash booking links.
- Produces: semantic service cards and a factual Nilima introduction.

- [ ] **Step 1: Write failing rendering tests** for the three names, exact prices/durations, Nilima's name in the hero, specific scope copy, absence of invented testimonials/credentials, and hash booking links.
- [ ] **Step 2: Run the focused test** and confirm the new content is absent.
- [ ] **Step 3: Implement `ServiceCards` and `MeetNilima`** using semantic headings, lists, links, and the existing button/focus patterns.
- [ ] **Step 4: Rewrite the hero and consultation sections** around the approved practitioner-led copy and transparent offers.
- [ ] **Step 5: Expand the FAQ only with supported answers** about birth time, preparation, privacy boundary, payment, rescheduling, and first consultations.
- [ ] **Step 6: Add responsive card styling** for three columns, two columns, and one column without layout-shifting hover effects.
- [ ] **Step 7: Run the landing test, TypeScript check, and build** and require success.
- [ ] **Step 8: Commit** with `feat(site): present Nilima and three readings`.

### Task 3: Service-aware booking page and scroll ownership

**Files:**
- Create: `src/components/ServiceSelector.tsx`
- Modify: `src/pages/BookPage.tsx`
- Modify: `src/components/CalIdEmbed.tsx`
- Modify: `src/styles/booking.css`
- Modify: `vercel.json` only if the verified official snippet requires a narrow CSP addition.
- Test: `tests/book-page.test.tsx`

**Interfaces:**
- Consumes: `consultationServices`, `getServiceByHash`, and validated service URLs.
- Produces: active service selection and an iframe/Inline-embed boundary that never receives query data.

- [ ] **Step 1: Write failing tests** for all service selectors, exact active details, hash-only selection, unchanged Cal ID destination, and the absence of query forwarding.
- [ ] **Step 2: Run `npx vitest run tests/book-page.test.tsx`** and confirm the service selector assertions fail.
- [ ] **Step 3: Implement the selector and active service summary** with buttons or hash links that announce the selected state.
- [ ] **Step 4: Make the existing profile iframe an explicit fallback** with a full responsive viewport, `scrolling="no"`, and an always-visible exact Cal ID link.
- [ ] **Step 5: Do not add the official runtime until the exact three Inline snippets are supplied.** Record the external gate instead of guessing its API or widening CSP.
- [ ] **Step 6: Run focused tests and browser-check the profile, calendar, and attendee form** at desktop and mobile sizes without submitting a booking.
- [ ] **Step 7: Commit** with `fix(booking): align service selection and scroll`.

### Task 4: Kundli brand mark and export pack

**Files:**
- Create: `public/brand/kundli-mark-master.png`
- Create: `public/brand/cal-id-logo-600x400.png`
- Create: `public/brand/favicon-32.png`
- Create: `public/brand/apple-touch-icon-180.png`
- Create: `public/brand/icon-192.png`
- Create: `public/brand/icon-512.png`
- Modify: `src/index.html`
- Modify: `src/book/index.html`
- Test: `tests/brand-assets.test.mjs`

**Interfaces:**
- Produces: one original transparent Kundli mark and deterministic size exports.

- [ ] **Step 1: Generate one transparent logo-brand master** from the supplied Kundli reference with no text, zodiac symbols, stars, moons, purple gradients, or watermark.
- [ ] **Step 2: Inspect the generated master at full size** and reject malformed line intersections, accidental text, or non-transparent backgrounds.
- [ ] **Step 3: Export the exact PNG sizes** while preserving transparency and keeping the Cal ID favicon candidate below 1 MB.
- [ ] **Step 4: Write and run asset tests** for existence, dimensions, PNG signatures, alpha, and file-size requirements.
- [ ] **Step 5: Wire website favicon and Apple touch icon links** into both HTML entry points.
- [ ] **Step 6: Commit** with `feat(brand): add Kundli identity assets`.

### Task 5: Final design, browser, and operational QA

**Files:**
- Modify: `design-qa.md`
- Modify: `docs/qa/cal-id-redesign-qa.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: reproducible evidence and a Cal ID upload/configuration checklist.

- [ ] **Step 1: Run `npm run check`, `npm test`, and `npm run build`** separately and record exact results.
- [ ] **Step 2: Inspect landing and booking pages at 375, 768, 1024, and 1440 CSS pixels** in the existing in-app browser.
- [ ] **Step 3: Verify keyboard navigation, focus, service selection, hash routing, external fallback, iframe scroll ownership, no horizontal overflow, and zero token forwarding.**
- [ ] **Step 4: Compare the updated landing page against the captured Starheal structure and the existing approved visual target** without copying Starheal's content or claims.
- [ ] **Step 5: Update QA records and README** with the asset upload paths, brand colours, event creation checklist, and the remaining three Inline-snippet gate.
- [ ] **Step 6: Set the final line of `design-qa.md` to exactly `final result: passed` only when every local visual issue is resolved.**
- [ ] **Step 7: Request final code and design review, resolve findings, and commit** with `test(site): verify three-reading experience`.

