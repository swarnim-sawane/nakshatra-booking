# Nakshatra Site-wide Editorial Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved site-wide hierarchy, motion, first-person practitioner story, mature FAQs, social links, resilient calendar fallback and branded 404 experience.

**Architecture:** Keep the existing React/Vite application and design tokens. Add one small Motion reveal primitive, one centralized social configuration, a dedicated NotFound page, and explicit early-return calendar states; then align shared CSS so every existing section inherits the same editorial hierarchy and responsive behavior.

**Tech Stack:** React 18.3, TypeScript 5.9, Vite 7.3, Motion for React (`motion/react`), lucide-react, Vitest, Testing Library, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-08-sitewide-editorial-refinement-design.md`

## Global Constraints

- Preserve Personal Consultation at 60 minutes and ₹1,000, Relationship Consultation at 60 minutes and ₹1,000, and Best Date Analysis at 30 minutes and ₹500.
- Keep Cal ID as the booking authority and Razorpay payment path; never expose `CALID_API_KEY` to frontend code.
- Use the existing real Nakshatra icon and consultation photographs; do not create CSS art, inline SVG artwork or decorative substitutes.
- Use real Instagram and Facebook icons with centralized mock profile URLs and no “Coming soon” interface copy.
- Use only verified claims: 8+ years of Kundli reading, Hindi and Marathi consultations, personal preparation, Google Meet and Razorpay.
- Use first-person voice only in the Meet Nilima practitioner section; retain clear service and policy voice elsewhere.
- Respect `prefers-reduced-motion`, preserve semantic HTML, maintain visible focus treatment and avoid nested scrolling.
- The worktree already contains user-owned uncommitted changes. Do not reset, clean or broadly stage it. Replace commit steps with scoped diff checkpoints unless the user explicitly requests commits.

---

## File structure

### Create

- `src/components/Reveal.tsx` — shared once-on-view Motion wrapper.
- `src/components/SocialLinks.tsx` — shared real-icon social navigation for header and footer.
- `src/pages/NotFoundPage.tsx` — branded recovery page for unknown routes.
- `src/404.html` — static-hosting entry that mounts the same React application.
- `tests/editorial-refinement.test.mjs` — source/CSS contract checks for motion and mobile hierarchy.

### Modify

- `package.json`, `package-lock.json` — add `motion`.
- `src/main.tsx` — apply global reduced-motion behavior through `MotionConfig`.
- `src/config/site.ts` — social configuration and mature FAQ content.
- `src/App.tsx` — explicit home, booking and not-found routing/metadata.
- `src/components/Header.tsx` — desktop and mobile social icon links.
- `src/components/Footer.tsx` — footer social links and reorganized navigation.
- `src/components/MeetNilima.tsx` — first-person copy, portrait reveal and professional caption.
- `src/components/ServiceCards.tsx` — restrained card staggering and consistent CTA treatment.
- `src/components/FAQ.tsx` — updated headings, reveal behavior and mature content groups.
- `src/components/AvailabilityCalendar.tsx` — full-body error and invalid-destination states.
- `src/styles/tokens.css` — shared motion easing and refined type tokens where needed.
- `src/styles/global.css` — social controls, button variants, header/footer and 404 styling.
- `src/styles/landing.css` — corrected hierarchy, section rhythm, service cards, portrait and mobile facts.
- `src/styles/availability-calendar.css` — composed fallback panels and button layout.
- `vite.config.cjs` — add the 404 document build input.
- `tests/landing-page.test.tsx` — first-person story, mature FAQ and button contracts.
- `tests/shell.test.tsx` — social links and 404 routing/metadata.
- `tests/availability-calendar.test.tsx` — replacement error-state behavior and retry.
- `tests/vite-config.test.mjs` — static 404 entry.

---

### Task 1: Motion foundation and editorial CSS contract

**Files:**
- Create: `src/components/Reveal.tsx`
- Create: `tests/editorial-refinement.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/main.tsx`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/styles/landing.css`

**Interfaces:**
- Produces: `Reveal({ children, className?, delay? }: RevealProps): JSX.Element`.
- Produces: global `MotionConfig reducedMotion="user"` behavior.
- Produces: `.button--quiet`, `.social-links`, `.social-link`, and normalized heading/mobile fact rules for later tasks.

- [ ] **Step 1: Add a failing source/CSS contract test**

Create `tests/editorial-refinement.test.mjs` with assertions that describe the approved system:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("uses Motion with user reduced-motion preferences", () => {
  const main = readFileSync("src/main.tsx", "utf8");
  const reveal = readFileSync("src/components/Reveal.tsx", "utf8");
  assert.match(main, /MotionConfig[^>]*reducedMotion="user"/);
  assert.match(reveal, /whileInView/);
  assert.match(reveal, /viewport=\{\{[^}]*once:\s*true/);
});

test("keeps compact editorial headings and two mobile hero facts", () => {
  const css = readFileSync("src/styles/landing.css", "utf8");
  assert.match(css, /\.landing-section h2\s*\{[^}]*font-size:\s*clamp\(2\.25rem,\s*3\.6vw,\s*3\.5rem\)/s);
  assert.match(css, /@media \(max-width:\s*640px\)[\s\S]*?\.landing-hero__facts\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
});
```

- [ ] **Step 2: Run the new test and verify the contract fails**

Run: `node --test tests/editorial-refinement.test.mjs`

Expected: FAIL because `Reveal.tsx`, `MotionConfig`, and the corrected CSS values do not yet exist.

- [ ] **Step 3: Install Motion**

Run: `npm install motion`

Expected: `package.json` and `package-lock.json` include `motion` without changing React versions.

- [ ] **Step 4: Create the reveal primitive**

Create `src/components/Reveal.tsx`:

```tsx
import { motion } from "motion/react";
import type { PropsWithChildren } from "react";

type RevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      transition={{ delay, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ amount: 0.2, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Apply global reduced-motion behavior**

Update `src/main.tsx` so the root render is:

```tsx
import { MotionConfig } from "motion/react";

createRoot(root).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
```

- [ ] **Step 6: Normalize the site hierarchy and action primitives**

Update shared styles with these exact targets:

```css
.eyebrow { font-size: clamp(0.76rem, 0.8vw, 0.82rem); }
.landing-section h2 { font-size: clamp(2.25rem, 3.6vw, 3.5rem); line-height: 1.04; }
.section-heading > p:last-child { max-width: 52ch; font-size: clamp(1rem, 1.15vw, 1.08rem); }

@media (max-width: 640px) {
  .landing-section h2 { font-size: clamp(2rem, 9vw, 2.7rem); }
  .landing-hero__facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

Remove `.landing-hero__facts` from the mobile selector that forces several grids to one column. Add `.button--quiet`, `.social-links` and `.social-link` as neutral ink/surface controls with the existing focus ring and `44px` minimum target.

- [ ] **Step 7: Run the foundation checks**

Run: `node --test tests/editorial-refinement.test.mjs`

Expected: PASS.

Run: `npm run check`

Expected: PASS.

- [ ] **Step 8: Record a scoped checkpoint**

Run: `git diff --check -- package.json package-lock.json src/main.tsx src/components/Reveal.tsx src/styles/tokens.css src/styles/global.css src/styles/landing.css tests/editorial-refinement.test.mjs`

Expected: no whitespace errors.

---

### Task 2: Social icons and coherent shell

**Files:**
- Create: `src/components/SocialLinks.tsx`
- Modify: `src/config/site.ts`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/styles/global.css`
- Modify: `tests/shell.test.tsx`

**Interfaces:**
- Produces: `socialProfiles`, a readonly array of `{ label, href, icon }` entries consumed by `SocialLinks`.
- Produces: `SocialLinks({ className?, label }: SocialLinksProps): JSX.Element`.
- Consumes: `.social-links` and `.social-link` from Task 1.

- [ ] **Step 1: Write failing social-shell tests**

Extend `tests/shell.test.tsx`:

```tsx
it("shows real social icons with configured destinations in the header and footer", () => {
  const html = renderToStaticMarkup(<App pathname="/" />);
  expect(html.match(/aria-label="Instagram"/g)).toHaveLength(3);
  expect(html.match(/aria-label="Facebook"/g)).toHaveLength(3);
  expect(html).toContain('href="https://www.instagram.com/nakshatra.placeholder/"');
  expect(html).toContain('href="https://www.facebook.com/nakshatra.placeholder/"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noreferrer noopener"');
  expect(html).not.toContain("Coming soon");
});
```

- [ ] **Step 2: Run the shell test and verify failure**

Run: `npx vitest run tests/shell.test.tsx`

Expected: FAIL because no social links are rendered.

- [ ] **Step 3: Centralize the mock destinations**

Add to `src/config/site.ts`:

```ts
export const socialProfiles = [
  { label: "Instagram", href: "https://www.instagram.com/nakshatra.placeholder/", icon: "instagram" },
  { label: "Facebook", href: "https://www.facebook.com/nakshatra.placeholder/", icon: "facebook" },
] as const;
```

Include a source comment stating that only these two values need replacement when the real profile URLs are available.

- [ ] **Step 4: Create the shared real-icon social navigation**

Create `src/components/SocialLinks.tsx`:

```tsx
import { Facebook, Instagram } from "lucide-react";
import { socialProfiles } from "../config/site";

type SocialLinksProps = {
  className?: string;
  label: string;
};

const icons = {
  facebook: Facebook,
  instagram: Instagram,
};

export default function SocialLinks({ className = "", label }: SocialLinksProps) {
  return (
    <nav className={`social-links ${className}`.trim()} aria-label={label}>
      {socialProfiles.map((profile) => {
        const Icon = icons[profile.icon];
        return (
          <a
            aria-label={profile.label}
            className="social-link"
            href={profile.href}
            key={profile.label}
            rel="noreferrer noopener"
            target="_blank"
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
          </a>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Render social navigation in both shell locations**

In `Header.tsx`, place these two instances so desktop icons sit before the booking CTA and mobile icons sit inside the menu:

```tsx
<SocialLinks className="header-socials header-socials--desktop" label="Social profiles" />
<SocialLinks className="header-socials header-socials--mobile" label="Social profiles" />
```

In `Footer.tsx`, place this instance beneath the practice summary:

```tsx
<SocialLinks className="site-footer__socials" label="Follow Nakshatra" />
```

- [ ] **Step 6: Finish header/footer layout**

Add these shared rules to `src/styles/global.css`, then place the mobile instance inside `.mobile-navigation nav`:

```css
.social-links { display: flex; align-items: center; gap: 0.35rem; }
.social-link {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-ink);
  text-decoration: none;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}
.social-link:hover { border-color: var(--color-accent); background: var(--color-accent-soft); transform: translateY(-1px); }
.header-socials--mobile { display: none; }
.site-footer__socials { margin-top: var(--space-5); }
.site-footer__links a { color: var(--color-text-muted); text-decoration-color: transparent; }

@media (max-width: 760px) {
  .header-socials--desktop { display: none; }
  .header-socials--mobile { display: flex; margin-top: var(--space-3); }
}
```

- [ ] **Step 7: Verify the shell**

Run: `npx vitest run tests/shell.test.tsx tests/landing-page.test.tsx`

Expected: PASS.

- [ ] **Step 8: Record a scoped checkpoint**

Run: `git diff --check -- src/config/site.ts src/components/SocialLinks.tsx src/components/Header.tsx src/components/Footer.tsx src/styles/global.css tests/shell.test.tsx`

Expected: no whitespace errors.

---

### Task 3: First-person About story and restrained portrait motion

**Files:**
- Modify: `src/components/MeetNilima.tsx`
- Modify: `src/styles/landing.css`
- Modify: `tests/landing-page.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1.
- Produces: `.meet-nilima__name`, `.meet-nilima__role`, and a button-styled consultation link.

- [ ] **Step 1: Replace the old practitioner-story assertions with first-person assertions**

Update the story test in `tests/landing-page.test.tsx`:

```tsx
expect(html).toContain("I study your Kundli before we speak.");
expect(html).toContain("I have been reading Kundlis for more than eight years.");
expect(html).toContain("Before every consultation, I prepare the chart myself");
expect(html).toContain("You can speak with me in Hindi or Marathi");
expect(html).toContain('class="meet-nilima__name">Nilima Sawane</');
expect(html).toContain("Kundli astrologer · Hindi and Marathi consultations");
expect(html).toContain('class="button button--secondary meet-nilima__link"');
expect(html).not.toContain("Nilima has offered");
```

- [ ] **Step 2: Run the landing test and verify failure**

Run: `npx vitest run tests/landing-page.test.tsx`

Expected: FAIL on the new first-person copy and caption classes.

- [ ] **Step 3: Implement the approved copy and motion**

Keep the existing section and grid, then render this story inside a delayed `Reveal`:

```tsx
<Reveal className="meet-nilima__story" delay={0.08}>
  <p className="eyebrow">Meet Nilima</p>
  <h2 id="meet-nilima-title">I study your Kundli before we speak.</h2>
  <p className="meet-nilima__experience">
    8+ years of Kundli reading · Consultations in Hindi and Marathi
  </p>
  <p>
    I have been reading Kundlis for more than eight years. Before every consultation,
    I prepare the chart myself and study the question or situation you have shared, so
    our time is not spent starting from the beginning.
  </p>
  <p>
    During the call, I explain the patterns I see in clear language and leave room for
    you to question, reflect and go deeper. Where it is appropriate, I may also suggest
    practical steps or traditional nuskhe—always as guidance, never as a promise.
  </p>
  <p className="meet-nilima__language-note">
    You can speak with me in Hindi or Marathi—whichever feels most natural.
  </p>
  <a className="button button--secondary meet-nilima__link" href="#consultation">
    View consultations
  </a>
</Reveal>
```

Render the portrait inside a Motion figure with `initial={{ opacity: 0, scale: 1.025, y: 16 }}`, `whileInView={{ opacity: 1, scale: 1, y: 0 }}`, `viewport={{ amount: 0.2, once: true }}`, and the shared `[0.22, 1, 0.36, 1]` easing. Preserve `/images/nilima-sawane.jpg` and `alt="Nilima Sawane"`.

- [ ] **Step 4: Style the professional caption**

Use this caption structure and styling:

```tsx
<figcaption>
  <span className="meet-nilima__name">Nilima Sawane</span>
  <span className="meet-nilima__role">Kundli astrologer · Hindi and Marathi consultations</span>
</figcaption>
```

```css
.meet-nilima__portrait figcaption { display: grid; justify-content: start; gap: 0.2rem; }
.meet-nilima__name {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 1.5vw, 1.3rem);
  font-style: italic;
  letter-spacing: 0.02em;
}
.meet-nilima__role { color: var(--color-text-muted); font-size: 0.78rem; }
```

- [ ] **Step 5: Verify the About section**

Run: `npx vitest run tests/landing-page.test.tsx tests/landing.test.tsx`

Expected: PASS.

Run: `npm run check`

Expected: PASS.

- [ ] **Step 6: Record a scoped checkpoint**

Run: `git diff --check -- src/components/MeetNilima.tsx src/styles/landing.css tests/landing-page.test.tsx`

Expected: no whitespace errors.

---

### Task 4: Mature FAQs, consultation-card rhythm and content buttons

**Files:**
- Modify: `src/config/site.ts`
- Modify: `src/components/FAQ.tsx`
- Modify: `src/components/ServiceCards.tsx`
- Modify: `src/styles/landing.css`
- Modify: `tests/landing-page.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1.
- Consumes: `consultationFaqItems` and `bookingFaqItems` from `src/config/site.ts`.
- Produces: staggered service cards and the exact mature FAQ set from the specification.

- [ ] **Step 1: Write failing FAQ and CTA tests**

Update `tests/landing-page.test.tsx` to require representative mature questions and remove the retired ones:

```tsx
expect(html).toContain("What can a Kundli reading clarify—and what can it not decide for me?");
expect(html).toContain("Can I discuss a sensitive personal or relationship matter privately?");
expect(html).toContain("Are traditional remedies or nuskhe guaranteed to work?");
expect(html).toContain("What should I do if live times do not load on this website?");
expect(html).not.toContain("Can I speak in Hindi or Marathi?");
expect(html).not.toContain("How does Nilima approach difficult questions?");
expect(html.match(/service-card__action/g)).toHaveLength(3);
```

- [ ] **Step 2: Run the landing tests and verify failure**

Run: `npx vitest run tests/landing-page.test.tsx`

Expected: FAIL because the old FAQ set is still configured.

- [ ] **Step 3: Replace the FAQ arrays with the approved ten-question content**

Use these exact entries in `src/config/site.ts`:

```ts
export const consultationFaqItems = [
  {
    question: "What kind of question is suitable for a consultation?",
    answer:
      "A focused question about a decision, recurring pattern, relationship, period of change or important date gives Nilima useful context. You do not need to know which astrological technique applies.",
  },
  {
    question: "What can a Kundli reading clarify—and what can it not decide for me?",
    answer:
      "A reading can help you understand patterns, timing and the considerations around a choice. It does not remove your agency, replace professional medical, legal or financial advice, or guarantee a particular outcome.",
  },
  {
    question: "What if my birth time is uncertain?",
    answer:
      "Share the most accurate information you have and say clearly when the time is uncertain. Nilima will explain which parts of the reading can be approached responsibly and which conclusions would be unreliable.",
  },
  {
    question: "How does Nilima prepare before we speak?",
    answer:
      "Nilima prepares your Janam Kundli herself and reviews the question or situation submitted with the booking. This allows the consultation to begin with context rather than spending most of the call gathering background.",
  },
  {
    question: "Can I discuss a sensitive personal or relationship matter privately?",
    answer:
      "Yes. Share only what is relevant and what you are comfortable discussing. Birth details and questions are submitted through the secure booking flow and used to prepare and conduct the consultation.",
  },
  {
    question: "Will the consultation tell me exactly what will happen?",
    answer:
      "No responsible reading can promise a fixed future. Nilima explains the tendencies and timing she sees, including uncertainty, so you can make a more considered decision.",
  },
  {
    question: "Are traditional remedies or nuskhe guaranteed to work?",
    answer:
      "No. Where relevant, Nilima may suggest a traditional nuska or practical step as guidance. It is not presented as a guaranteed result or a substitute for professional care.",
  },
] as const;

export const bookingFaqItems = [
  {
    question: "What happens after I choose a consultation time?",
    answer:
      "You continue to the secure Cal ID booking page, provide the requested birth details and questions, and complete payment through Razorpay. The confirmed booking includes the online meeting information.",
  },
  {
    question: "How do I change or cancel a booking?",
    answer:
      "Use the booking-management link in the confirmation email. Any cancellation or refund follows the terms shown before payment.",
  },
  {
    question: "What should I do if live times do not load on this website?",
    answer:
      "Use the secure booking button shown in the calendar panel. It opens the same consultation on Cal ID, where you can view current availability and continue normally.",
  },
] as const;
```

In `FAQ.tsx`, assign `id="privacy"` when the question is `Can I discuss a sensitive personal or relationship matter privately?` and preserve `id="booking-policies"` on the booking group.

- [ ] **Step 4: Add restrained section and card reveals**

Use `Reveal` for the FAQ introduction and FAQ groups. Convert the service-card map callback to include `index`, then use:

```tsx
<motion.article
  aria-labelledby={`${service.slug}-title`}
  className="service-card"
  initial={{ opacity: 0, y: 16 }}
  key={service.slug}
  transition={{ delay: index * 0.07, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
  viewport={{ amount: 0.18, once: true }}
  whileInView={{ opacity: 1, y: 0 }}
>
  <div className="service-card__visual" aria-hidden="true">
    <img alt="" loading="lazy" src={service.imageSrc} />
  </div>
  <div className="service-card__header">
    <h3 id={`${service.slug}-title`}>{service.name}</h3>
    <p>{service.purpose}</p>
  </div>
  <dl className="service-card__facts">
    <div>
      <dt>Duration</dt>
      <dd>{service.durationMinutes} minutes</dd>
    </div>
    <div>
      <dt>Price</dt>
      <dd>{formatPrice(service.priceInr)}</dd>
    </div>
  </dl>
  <a className="button button--primary service-card__action" href={`/book/${service.hash}`}>
    View available times
  </a>
</motion.article>
```

- [ ] **Step 5: Normalize card height and title rhythm**

Apply these targets in `src/styles/landing.css`:

```css
.service-cards__grid { align-items: stretch; }
.service-card { height: 100%; }
.service-card__header { display: grid; align-content: start; min-height: 12.5rem; }
.service-card__header h3 { font-size: clamp(1.65rem, 2vw, 2.15rem); line-height: 1.12; }
.service-card__header > p { color: var(--color-text-muted); font-size: 1rem; line-height: 1.65; }
.service-card__facts { margin-top: auto; }
.service-card__action { width: calc(100% - (2 * clamp(22px, 2.2vw, 30px))); }

@media (max-width: 640px) {
  .service-card__header { min-height: 0; }
  .service-card__header h3 { font-size: clamp(1.6rem, 7vw, 2rem); }
}
```

- [ ] **Step 6: Verify content and service behavior**

Run: `npx vitest run tests/landing-page.test.tsx tests/book-page.test.tsx`

Expected: PASS, with all three service destinations unchanged.

- [ ] **Step 7: Record a scoped checkpoint**

Run: `git diff --check -- src/config/site.ts src/components/FAQ.tsx src/components/ServiceCards.tsx src/styles/landing.css tests/landing-page.test.tsx`

Expected: no whitespace errors.

---

### Task 5: Replace dead calendar chrome with complete fallback panels

**Files:**
- Modify: `src/components/AvailabilityCalendar.tsx`
- Modify: `src/styles/availability-calendar.css`
- Modify: `tests/availability-calendar.test.tsx`

**Interfaces:**
- Preserves: `AvailabilityCalendarProps` and successful Cal ID slot handoff.
- Produces: full-card `.availability-calendar__alternate` for `error` and invalid-destination states.
- Produces: `CalendarAlternateState({ bookingUrl, kind, onRetry, service }: CalendarAlternateStateProps): JSX.Element`.

- [ ] **Step 1: Strengthen the failing error-state test**

Replace the current network-error expectations with:

```tsx
await screen.findByText("Live availability could not be loaded.");
expect(screen.queryByText("September 2026")).toBeNull();
expect(screen.queryByRole("button", { name: "Previous month" })).toBeNull();
expect(screen.queryByText("Secure online booking")).toBeNull();
const fallback = screen.getByRole<HTMLAnchorElement>("link", {
  name: "Continue to secure booking",
});
expect(fallback.href).toBe(
  "https://cal.id/nilima-sawane/personal-consultation?duration=60&s=private-token",
);
expect(screen.getByRole("button", { name: "Try loading times again" })).toBeTruthy();
```

Update the invalid-destination test to require `Booking is temporarily unavailable.` and confirm there is no external link.

- [ ] **Step 2: Run the calendar test and verify failure**

Run: `npx vitest run tests/availability-calendar.test.tsx`

Expected: FAIL because the old month grid and underlined retry remain.

- [ ] **Step 3: Add the explicit alternate-state component**

Add this local component above `AvailabilityCalendar`:

```tsx
type CalendarAlternateStateProps = {
  bookingUrl: URL | null;
  kind: "error" | "unavailable";
  onRetry?: () => void;
  service: ConsultationService;
};

function CalendarAlternateState({
  bookingUrl,
  kind,
  onRetry,
  service,
}: CalendarAlternateStateProps) {
  const isError = kind === "error";
  return (
    <section className="availability-calendar availability-calendar--alternate">
      <header className="availability-calendar__header">
        <div>
          <p className="eyebrow">{service.name}</p>
          <h2>{isError ? "Choose your time" : "Booking availability"}</h2>
        </div>
        <div className="availability-calendar__service-meta">
          <strong>{service.durationMinutes} min</strong>
          <span>₹{service.priceInr.toLocaleString("en-IN")}</span>
        </div>
      </header>
      <div className="availability-calendar__alternate-body">
        <img alt="" aria-hidden="true" height="48" src="/brand/icon-192.png" width="48" />
        <p className="eyebrow">Secure online booking</p>
        <h3>
          {isError
            ? "Live availability could not be loaded."
            : "Booking is temporarily unavailable."}
        </h3>
        <p>
          {isError
            ? "You can still continue securely to Nilima's booking page and choose a time there."
            : "Please refresh the page or return to the consultations."}
        </p>
        <div className="availability-calendar__alternate-actions">
          {bookingUrl ? (
            <a className="button button--primary" href={bookingUrl.href}>
              Continue to secure booking
            </a>
          ) : (
            <a className="button button--primary" href="/#consultation">
              Return to consultations
            </a>
          )}
          {onRetry ? (
            <button className="button button--secondary" onClick={onRetry} type="button">
              Try loading times again
            </button>
          ) : null}
        </div>
        {isError ? (
          <p className="availability-calendar__alternate-note">
            Your consultation details and payment are completed securely through Cal ID.
          </p>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Branch before rendering normal calendar chrome**

Add these early returns after state declarations and before month-grid rendering:

```tsx
if (!safeBookingUrl) {
  return <CalendarAlternateState bookingUrl={null} kind="unavailable" service={service} />;
}

if (requestState === "error") {
  return (
    <CalendarAlternateState
      bookingUrl={safeBookingUrl}
      kind="error"
      onRetry={() => setRetryCount((value) => value + 1)}
      service={service}
    />
  );
}
```

- [ ] **Step 5: Style the alternate panel**

Add these rules to `src/styles/availability-calendar.css`:

```css
.availability-calendar__alternate-body {
  display: grid;
  min-height: 20rem;
  place-content: center;
  justify-items: start;
  padding: clamp(2rem, 5vw, 4.5rem);
  border-top: 1px solid var(--color-border);
  background: linear-gradient(135deg, var(--color-surface) 20%, var(--color-accent-soft) 140%);
}
.availability-calendar__alternate-body > img { width: 46px; height: 46px; margin-bottom: 1.25rem; object-fit: contain; }
.availability-calendar__alternate-body h3 { max-width: 18ch; margin: 0.35rem 0 0.8rem; font-size: clamp(1.8rem, 3vw, 2.7rem); line-height: 1.08; }
.availability-calendar__alternate-body > p:not(.eyebrow) { max-width: 54ch; margin: 0; color: var(--color-text-muted); }
.availability-calendar__alternate-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
.availability-calendar__alternate-note { margin-top: 1.25rem !important; font-size: 0.78rem; }

@media (max-width: 520px) {
  .availability-calendar__alternate-actions { width: 100%; flex-direction: column; }
  .availability-calendar__alternate-actions .button { width: 100%; }
}
```

- [ ] **Step 6: Verify retry and successful booking remain intact**

Add a user-event assertion that clicking `Try loading times again` invokes `loadAvailability` again. Then run:

`npx vitest run tests/availability-calendar.test.tsx tests/scheduling.test.ts`

Expected: PASS, including the original safe slot URL test.

- [ ] **Step 7: Record a scoped checkpoint**

Run: `git diff --check -- src/components/AvailabilityCalendar.tsx src/styles/availability-calendar.css tests/availability-calendar.test.tsx`

Expected: no whitespace errors.

---

### Task 6: Branded 404 routing and static-host entry

**Files:**
- Create: `src/pages/NotFoundPage.tsx`
- Create: `src/404.html`
- Modify: `src/App.tsx`
- Modify: `src/styles/global.css`
- Modify: `vite.config.cjs`
- Modify: `tests/shell.test.tsx`
- Modify: `tests/book-page.test.tsx`
- Modify: `tests/vite-config.test.mjs`

**Interfaces:**
- Changes: `getRouteKind(pathname: string): "home" | "booking" | "not-found"`.
- Changes: `getPageMetadata(pathname: string)` returns not-found metadata for unknown paths.
- Produces: `NotFoundPage(): JSX.Element`.

- [ ] **Step 1: Write failing route, rendering and build-input tests**

Add to `tests/shell.test.tsx`:

```tsx
it("renders a branded recovery page for an unknown path", () => {
  const html = renderToStaticMarkup(<App pathname="/missing-page" />);
  expect(html).toContain("Page not found");
  expect(html).toContain('href="/">Return home</a>');
  expect(html).toContain('href="/#consultation">View consultations</a>');
  expect(html.match(/src="\/brand\/icon-192\.png"/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
});
```

Add to `tests/book-page.test.tsx`:

```tsx
expect(getRouteKind("/missing-page")).toBe("not-found");
```

Add to `tests/vite-config.test.mjs`:

```js
test("builds a static 404 document", () => {
  assert.match(viteConfig.build.rollupOptions.input.notFound, /src[\\/]404\.html$/);
});
```

- [ ] **Step 2: Run route/build tests and verify failure**

Run: `npx vitest run tests/shell.test.tsx tests/book-page.test.tsx`

Run: `node --test tests/vite-config.test.mjs`

Expected: FAIL because unknown paths currently map to home and no 404 input exists.

- [ ] **Step 3: Implement explicit route selection**

Update `getRouteKind`:

```ts
export function getRouteKind(pathname: string) {
  if (pathname === "/") return "home" as const;
  if (pathname === "/book" || pathname === "/book/") return "booking" as const;
  return "not-found" as const;
}
```

Add metadata:

```ts
const notFoundPage = {
  title: "Page not found | Nakshatra",
  description: "The requested Nakshatra page could not be found. Return home or view consultations with Nilima Sawane.",
};
```

Render `NotFoundPage` for the new route.

- [ ] **Step 4: Create the recovery page**

Create `src/pages/NotFoundPage.tsx`:

```tsx
import Reveal from "../components/Reveal";

export default function NotFoundPage() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <Reveal className="not-found__panel">
        <img alt="" aria-hidden="true" height="64" src="/brand/icon-192.png" width="64" />
        <p className="eyebrow">Nakshatra</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>The page you were looking for is not here. You can return home or choose a consultation.</p>
        <div className="not-found__actions">
          <a className="button button--primary" href="/">Return home</a>
          <a className="button button--secondary" href="/#consultation">View consultations</a>
        </div>
      </Reveal>
    </section>
  );
}
```

Add the matching layout rules to `src/styles/global.css`:

```css
.not-found { display: grid; min-height: min(70vh, 760px); place-items: center; padding: var(--space-16) var(--page-gutter); }
.not-found__panel { width: min(720px, 100%); padding: clamp(2rem, 6vw, 5rem); border: 1px solid var(--color-border); background: var(--color-surface); text-align: center; }
.not-found__panel > img { width: 56px; height: 56px; object-fit: contain; }
.not-found__panel h1 { margin: var(--space-4) 0; font-size: clamp(2.75rem, 7vw, 5.5rem); line-height: 1; }
.not-found__panel > p:not(.eyebrow) { max-width: 48ch; margin-inline: auto; color: var(--color-text-muted); }
.not-found__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); margin-top: var(--space-8); }
```

- [ ] **Step 5: Add the static document entry**

Create `src/404.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon-180.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <title>Page not found | Nakshatra</title>
    <meta name="description" content="The requested Nakshatra page could not be found. Return home or view consultations with Nilima Sawane." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

Add this exact entry to the Vite input map:

```js
notFound: resolve(srcRoot, "404.html"),
```

to the Vite input map.

- [ ] **Step 6: Verify the route and built artifact**

Run: `npx vitest run tests/shell.test.tsx tests/book-page.test.tsx`

Run: `node --test tests/vite-config.test.mjs`

Run: `npm run build`

Expected: PASS and `dist/404.html` exists.

- [ ] **Step 7: Record a scoped checkpoint**

Run: `git diff --check -- src/pages/NotFoundPage.tsx src/404.html src/App.tsx src/styles/global.css vite.config.cjs tests/shell.test.tsx tests/book-page.test.tsx tests/vite-config.test.mjs`

Expected: no whitespace errors.

---

### Task 7: Integrated verification and visual QA

**Files:**
- Modify: `design-qa.md`
- Verify: all files changed by Tasks 1–6.

**Interfaces:**
- Consumes: the completed application and the five supplied problem screenshots.
- Produces: a passing `design-qa.md` with desktop, mobile, error-state and interaction evidence.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm run check`

Expected: PASS.

Run: `npm test`

Expected: build, Node tests and Vitest all PASS.

- [ ] **Step 2: Start or refresh the local preview**

Run: `npm run preview -- --host 127.0.0.1 --port 4173`

Expected: the existing in-app browser can load the current build at port 4173.

- [ ] **Step 3: Verify desktop states in the in-app browser**

At the same viewport proportions as the supplied desktop screenshots, inspect:

- hero fits cleanly without nested scrolling;
- section label, heading and body hierarchy;
- equal service-card image/content/CTA alignment;
- first-person About copy and portrait entrance;
- real header/footer social icons;
- successful calendar and full replacement error panel;
- 404 actions and shell.

- [ ] **Step 4: Verify mobile states in the in-app browser**

At a narrow mobile viewport, inspect:

- Experience and Languages remain side-by-side;
- header and mobile menu do not overflow;
- portrait and caption remain proportionate;
- service cards become full-row cards;
- calendar fallback buttons stack and remain tappable;
- no horizontal or nested scrollbars appear.

- [ ] **Step 5: Compare references and implementation together**

Capture matching local screenshots for the supplied desktop consultation hierarchy, mobile hero facts and calendar error states. Place each supplied screenshot beside its matching local capture in the visual comparison input, record visible differences, and fix all P0, P1 and P2 findings.

- [ ] **Step 6: Complete `design-qa.md`**

Record:

```md
# Nakshatra editorial refinement design QA

- Desktop hierarchy: passed
- Mobile hierarchy and two-column facts: passed
- Calendar success and replacement fallback: passed
- About portrait motion and reduced-motion behavior: passed
- Header/footer social controls: passed
- 404 recovery: passed
- Keyboard focus and console: passed

final result: passed
```

Only write `final result: passed` after the compared screenshots and interaction checks have no P0, P1 or P2 findings.

- [ ] **Step 7: Final scoped diff audit**

Run: `git diff --check`

Run: `git status --short`

Expected: no whitespace errors; unrelated existing user-owned changes remain untouched and visible.
