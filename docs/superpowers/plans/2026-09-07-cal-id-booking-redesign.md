# Cal ID Booking Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing prototype as a premium Astro/TypeScript one-to-one astrology site with a safe Cal ID booking page and a stable route for future WhatsApp sessions.

**Architecture:** Astro renders a mostly static marketing site and a dedicated `/book` route. A pure TypeScript configuration module validates the public Cal ID booking URL; Cal ID owns live scheduling, Google Meet and native Razorpay payment, while the site contains no booking secrets or customer persistence. The old prototype is preserved outside the active build because this directory has no Git history.

**Tech Stack:** Astro, TypeScript, Vitest, self-hosted Fontsource variable fonts, semantic HTML, modern CSS, Cal ID inline booking URL, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-09-07-cal-id-booking-redesign-design.md`

## Global Constraints

- Selected visual target is Option 3, Booking-First Concierge.
- Use warm paper `#F7F3EA`, surface `#FFFDF8`, ink `#1C1915`, forest `#2F5D50`, ochre `#A97835`, border `#D8CEC0` and error `#A34A43`.
- Use Newsreader for display text and Manrope for body/interface text, with Devanagari-ready fallbacks.
- The first release offers one 60-minute consultation and never invents a price, biography, policy, testimonial or credential.
- Cal ID owns availability, booking questions, Google Meet, Razorpay payment, confirmation, cancellation, rescheduling and refunds.
- No API key, Razorpay secret, webhook secret, Meta token, birth detail or customer record may enter client storage or a public URL.
- `/book?s=<opaque-token>` remains a stable future WhatsApp entry point; the current release ignores and never forwards the token.
- No live booking, payment, cancellation, deployment or WhatsApp message during implementation or verification.
- Preserve the old prototype under `legacy/calcom-prototype/`; do not delete it.
- Keep source files below 500 lines.
- Use the Codex in-app browser for visual QA; do not use Playwright CLI.

---

### Task 1: Preserve the prototype and establish the Astro application

**Files:**
- Create: `.gitignore`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `tests/structure.test.mjs`
- Replace: `package.json`
- Move: `index.html`, `css/`, `js/`, `api/`, `booking-admin.html`, `login.html`, `README.md`, `vercel.json` to `legacy/calcom-prototype/`

**Interfaces:**
- Consumes: approved design spec and current prototype files.
- Produces: Astro project scripts `dev`, `check`, `test`, `build`, `preview`; preserved legacy tree.

- [ ] **Step 1: Verify every move target stays inside the workspace**

Run:

```powershell
$workspace = (Resolve-Path '.').Path
$legacy = Join-Path $workspace 'legacy\calcom-prototype'
@('index.html','css','js','api','booking-admin.html','login.html','README.md','vercel.json') | ForEach-Object {
  $resolved = Join-Path $workspace $_
  if (-not $resolved.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe path: $resolved" }
  [pscustomobject]@{ Source = $resolved; Exists = Test-Path -LiteralPath $resolved }
}
```

Expected: all eight targets resolve below the workspace and exist.

- [ ] **Step 2: Write the failing structure test**

```js
// tests/structure.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("active app is Astro and the prototype is preserved", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts.build, "astro build");
  assert.ok(existsSync("src/pages/index.astro"));
  assert.ok(existsSync("legacy/calcom-prototype/index.html"));
});
```

- [ ] **Step 3: Run the test and verify failure**

Run: `node --test tests/structure.test.mjs`

Expected: FAIL because the active Astro page and legacy copy do not exist.

- [ ] **Step 4: Preserve the prototype with explicit PowerShell moves**

Create `legacy/calcom-prototype`, then move only the verified targets from Step 1 with `Move-Item -LiteralPath`. Do not move `docs`, `node_modules` or generated design evidence.

- [ ] **Step 5: Create the project metadata**

```json
{
  "name": "celestial-guidance-booking",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "test": "astro build && node --test tests/*.test.mjs && vitest run",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@fontsource-variable/manrope": "latest",
    "@fontsource-variable/newsreader": "latest",
    "astro": "latest"
  },
  "devDependencies": {
    "@astrojs/check": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Use `astro.config.mjs` with `output: "static"`, trailing slashes set to `always`, and site URL read only from `SITE_URL` when present. Extend `astro/tsconfigs/strict` in `tsconfig.json`.

- [ ] **Step 6: Install dependencies and create the initial page**

Run: `npm install`

Create `src/pages/index.astro` with semantic `<main><h1>Celestial Guidance</h1></main>` so the structure test has a minimal target.

- [ ] **Step 7: Run the test and build**

Run: `node --test tests/structure.test.mjs`

Expected: PASS.

Run: `npm run build`

Expected: Astro emits `dist/index.html` without an error.

- [ ] **Step 8: Initialize clean local version control**

Create `.gitignore` containing `.env*`, `!.env.example`, `node_modules/`, `dist/`, `.astro/`, `.vercel/` and `legacy/calcom-prototype/`. Run `git init`, inspect `git status --short`, stage only the new active application, tests, docs and lockfile, then commit:

```bash
git commit -m "chore(app): establish Astro booking site"
```

### Task 2: Add the public scheduling configuration contract

**Files:**
- Create: `src/config/scheduling.ts`
- Create: `src/config/site.ts`
- Create: `tests/scheduling.test.ts`
- Create: `.env.example`

**Interfaces:**
- Consumes: `import.meta.env.PUBLIC_CAL_ID_BOOKING_URL`.
- Produces: `SchedulingConfig`, `parseCalIdBookingUrl(value)`, `schedulingConfig`, and truthful site-content constants.

- [ ] **Step 1: Write failing URL-policy tests**

```ts
import { describe, expect, it } from "vitest";
import { parseCalIdBookingUrl } from "../src/config/scheduling";

describe("parseCalIdBookingUrl", () => {
  it("accepts an HTTPS Cal ID event URL", () => {
    expect(parseCalIdBookingUrl("https://cal.id/example/consultation")?.hostname).toBe("cal.id");
  });
  it.each(["", "http://cal.id/example", "https://evil.example/book", "javascript:alert(1)"])(
    "rejects unsafe value %s",
    (value) => expect(parseCalIdBookingUrl(value)).toBeNull(),
  );
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npx vitest run tests/scheduling.test.ts`

Expected: FAIL because `src/config/scheduling.ts` does not exist.

- [ ] **Step 3: Implement the pure scheduling contract**

```ts
export type SchedulingConfig = {
  provider: "cal-id";
  bookingUrl: URL | null;
  defaultTimeZone: "Asia/Kolkata";
  sessionMinutes: 60;
};

export function parseCalIdBookingUrl(value: string): URL | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["cal.id", "app.cal.id"].includes(url.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}

export const schedulingConfig: SchedulingConfig = {
  provider: "cal-id",
  bookingUrl: parseCalIdBookingUrl(import.meta.env.PUBLIC_CAL_ID_BOOKING_URL ?? ""),
  defaultTimeZone: "Asia/Kolkata",
  sessionMinutes: 60,
};
```

`.env.example` contains only `PUBLIC_CAL_ID_BOOKING_URL=https://cal.id/example/consultation` and `SITE_URL=https://example.com`; the values are documentation examples, never runtime defaults.

- [ ] **Step 4: Add truthful site constants**

`src/config/site.ts` exports `brandName`, `navigation`, `sessionFacts`, `howItWorks`, `explorationTopics` and `faqItems`. Exclude price, years, customer counts, ratings, testimonials, policies and contact details.

- [ ] **Step 5: Run tests and type checks**

Run: `npm test`

Expected: all Node and Vitest tests pass.

Run: `npm run check`

Expected: zero Astro or TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add .env.example src/config tests/scheduling.test.ts
git commit -m "feat(config): add safe Cal ID boundary"
```

### Task 3: Build the design foundation and reusable shell

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/BookingAction.astro`

**Interfaces:**
- Consumes: brand and navigation constants from `src/config/site.ts`.
- Produces: shared page layout, navigation and `.button` variants used by both routes.

- [ ] **Step 1: Add a failing rendered-output assertion**

Extend `tests/structure.test.mjs` to assert that the built `dist/index.html` contains a skip link, navigation label, `/book/` link and no `rzp_test_`, `astrology123`, `Cal.com` or `localStorage` strings. The `npm test` script builds before running this assertion.

- [ ] **Step 2: Verify failure**

Run: `npm run build` and then `node --test tests/structure.test.mjs`.

Expected: FAIL because the shell has not been created.

- [ ] **Step 3: Implement tokens and global rules**

Import the two Fontsource variable packages in `BaseLayout.astro`. Define the exact global palette and spacing from Global Constraints, `--font-display: "Newsreader Variable", "Noto Serif Devanagari", Georgia, serif`, and `--font-body: "Manrope Variable", "Noto Sans Devanagari", system-ui, sans-serif`. Add visible `:focus-visible`, reduced-motion support, a 1240px container and 44px minimum interactive targets.

- [ ] **Step 4: Implement the page shell**

`BaseLayout.astro` accepts `{ title, description }`, renders metadata, skip link, Header, slot, and Footer. `BookingAction.astro` accepts `{ label?: string, class?: string }` and always links to `/book/`. Header uses semantic navigation and a small CSS-only disclosure for mobile; its booking action remains visible at 390px.

- [ ] **Step 5: Verify output and commit**

Run: `npm run check && npm run build && node --test tests/structure.test.mjs`

Expected: all checks pass.

```bash
git add src/components src/layouts src/styles src/pages/index.astro tests/structure.test.mjs
git commit -m "feat(ui): add premium editorial design foundation"
```

### Task 4: Implement the approved Option 3 landing journey

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/TrustRow.astro`
- Create: `src/components/ConsultationOverview.astro`
- Create: `src/components/HowItWorks.astro`
- Create: `src/components/AboutPractice.astro`
- Create: `src/components/Preparation.astro`
- Create: `src/components/FAQ.astro`
- Create: `public/images/consultation-desk.webp`
- Modify: `src/pages/index.astro`
- Modify: `tests/structure.test.mjs`

**Interfaces:**
- Consumes: shared configuration and `BookingAction`.
- Produces: responsive home route with IDs `about`, `consultation`, `process`, `prepare`, and `faqs`.

- [ ] **Step 1: Define the failing page-contract assertions**

Assert after build that `dist/index.html` contains exactly one `<h1`, all five section IDs, the phrases “Google Meet” and “Razorpay”, and at least two `/book/` links; assert it does not contain `₹1`, `1000+`, `98%`, `4.9/5` or “Professional Photo”.

- [ ] **Step 2: Verify failure**

Run: `npm run build && node --test tests/structure.test.mjs`.

Expected: FAIL on missing sections.

- [ ] **Step 3: Generate the fitted hero asset**

Use ImageGen to create one 1600×1000 editorial photograph: warm natural daylight, hands making notes beside a legitimate printed Vedic birth-chart diagram, linen, notebook and a restrained brass object; no face, text, logo, device, purple, temple imagery or mystical effects. Inspect the result, save it as `public/images/consultation-desk.webp`, and verify the crop at desktop and mobile slots.

- [ ] **Step 4: Implement the hero and booking preview**

Hero copy uses “A private space for clarity and direction,” one short paragraph and factual trust rows. The right panel must not invent available times: show the image, “Live availability on the booking page,” the 60-minute/timezone facts and a working `/book/` action.

- [ ] **Step 5: Implement supporting sections**

Use one flagship consultation section, a three-step process, truthful About copy without credentials, preparation guidance, an accessible native `<details>` FAQ list and a final booking action. Do not create testimonial or vanity-stat sections.

- [ ] **Step 6: Implement responsive behavior**

At 960px collapse the split hero; at 640px reduce section spacing and display typography, keep 24px gutters, stack trust facts, prevent overflow and retain every booking CTA.

- [ ] **Step 7: Verify and commit**

Run: `npm run check && npm test && npm run build`.

Expected: all checks pass.

```bash
git add public/images src/components src/pages/index.astro tests/structure.test.mjs
git commit -m "feat(site): build booking-first consultation journey"
```

### Task 5: Implement the Cal ID booking page and failure states

**Files:**
- Create: `src/components/CalIdEmbed.astro`
- Create: `src/pages/book.astro`
- Create: `tests/book-page.test.mjs`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `schedulingConfig.bookingUrl` and ignores the optional `s` query parameter.
- Produces: `/book/` with titled Cal ID iframe, retry/link fallback and no local success inference.

- [ ] **Step 1: Write the failing booking-page test**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("booking page fails closed without Cal ID configuration", () => {
  const html = readFileSync("dist/book/index.html", "utf8");
  assert.match(html, /Online booking is being connected/);
  assert.doesNotMatch(html, /<iframe/i);
  assert.doesNotMatch(html, /razorpay_order_id|payment successful|localStorage/i);
});
```

- [ ] **Step 2: Verify failure**

Run: `npm run build && node --test tests/book-page.test.mjs`.

Expected: FAIL because `/book/` does not exist.

- [ ] **Step 3: Implement a fail-closed embed component**

`CalIdEmbed.astro` accepts `{ bookingUrl: URL | null }`. With null it renders the exact safe message from the test. With a value it renders a titled, lazy iframe using only the validated URL and a direct “Open Cal ID in a new tab” fallback link with `target="_blank"` and `rel="noopener noreferrer"`. It never reads, forwards or displays the `s` parameter.

- [ ] **Step 4: Build the booking route**

Use the shared layout, concise 60-minute/Google Meet/Razorpay context, a privacy note explaining that scheduling and payment happen securely within Cal ID, and the embed. Do not render a fake confirmation page.

- [ ] **Step 5: Add static hosting security headers**

Create `vercel.json` with `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` and a CSP allowing frames only from `https://cal.id` and `https://app.cal.id`. Do not add legacy function environment variables.

- [ ] **Step 6: Verify configured and unconfigured builds**

Run the default build and booking-page test. Then build once with `PUBLIC_CAL_ID_BOOKING_URL=https://cal.id/example/consultation` and inspect `dist/book/index.html` for a titled iframe whose hostname is `cal.id`. Restore the unconfigured local environment afterward.

- [ ] **Step 7: Commit**

```bash
git add src/components/CalIdEmbed.astro src/pages/book.astro tests/book-page.test.mjs vercel.json
git commit -m "feat(booking): add safe Cal ID booking page"
```

### Task 6: Final visual QA, accessibility checks and handoff

**Files:**
- Create: `docs/qa/cal-id-redesign-qa.md`
- Create: `README.md`
- Modify: active source files only when the evidence identifies a mismatch.

**Interfaces:**
- Consumes: selected Option 3 concept, built Astro routes and all test commands.
- Produces: verified local preview and documented remaining external setup.

- [ ] **Step 1: Run the complete automated gate**

Run: `npm run check`, `npm test`, and `npm run build` separately.

Expected: each exits zero with no warnings that hide failures.

- [ ] **Step 2: Start the local preview**

Run `npm run dev -- --host 127.0.0.1` in a persistent terminal session and open the local site in the Codex in-app browser.

- [ ] **Step 3: Capture matching visual states**

Capture the landing page at 1440×1024 and 390×844 plus `/book/` at both sizes. Keep the selected Option 3 concept and rendered screenshot together when judging hierarchy, typography, spacing, imagery, border radii and booking prominence.

- [ ] **Step 4: Walk the real interaction contract**

Verify keyboard navigation, header anchors, all booking CTAs, mobile navigation, FAQ disclosures, `/book?s=opaque-test-token`, safe unconfigured state and direct fallback. Confirm there is no horizontal overflow and no primary action disappears.

- [ ] **Step 5: Inspect browser diagnostics**

Read console errors and accessibility state through the in-app browser. Fix application errors; document expected third-party blocking separately.

- [ ] **Step 6: Record the evidence**

`docs/qa/cal-id-redesign-qa.md` records viewport, route, result, screenshot path, automated command results, and these remaining live gates: real Cal ID event URL, Google Calendar/Meet connection, confirmed price, real brand/profile/contact content, policies and activated Razorpay Live Mode.

Create `README.md` with the product purpose, `npm install`, `npm run dev`, `npm run check`, `npm test`, `npm run build`, the two public environment variables, the Cal ID dashboard prerequisites and an explicit statement that WhatsApp automation is a later phase described in the design spec.

- [ ] **Step 7: Re-run and commit final fixes**

Run: `npm run check && npm test && npm run build`.

Expected: all checks pass after the final visual comparison.

```bash
git add src public tests docs/qa package.json package-lock.json astro.config.mjs tsconfig.json vercel.json
git commit -m "test(site): verify Cal ID redesign across viewports"
```
