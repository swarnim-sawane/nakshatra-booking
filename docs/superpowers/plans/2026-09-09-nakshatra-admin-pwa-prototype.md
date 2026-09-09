# Nakshatra Admin PWA Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally verified, installable `/admin/` Android-oriented prototype that displays fictional Nakshatra appointments and exercises device-only notifications without connecting real booking data.

**Architecture:** Add a separate Vite multi-page entry so the admin interface does not share customer-page routing or layout. Keep relative demo booking generation and formatting in a focused data module, UI state in `AdminApp`, and browser installation/notification behavior behind a small PWA module that degrades safely.

**Tech Stack:** React 18, TypeScript 5.9, Vite 7, Vitest, Testing Library, browser Web App Manifest and Service Worker APIs, existing Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-09-09-nakshatra-admin-pwa-prototype-design.md`

## Global Constraints

- Route is exactly `/admin/`; `/` and `/book/` must remain unchanged.
- All people, booking references, and appointments are fictional and visibly labelled `Prototype — sample bookings`.
- Store no API key, backend URL, authentication token, phone number, email address, birth detail, consultation question, payment metadata, or sensitive note.
- Use `Asia/Kolkata` for prototype booking display and generate dates relative to the supplied/current clock.
- Accept meeting actions only for valid HTTPS URLs; cancelled bookings never expose a meeting action.
- Scope the service worker to `/admin/` only.
- Add no runtime dependency and make no Northflank, Strapi, Cal ID, Razorpay, Firebase, email, or WhatsApp change.
- Real data and live notifications stay deferred until authentication and a durable backend are designed.

---

## File map

- Create `src/admin/bookings.ts`: booking domain type, relative fictional records, filtering, ordering, time formatting, and safe meeting URL validation.
- Create `src/admin/pwa.ts`: install-prompt typing, service-worker registration, notification capability and device-only test notification.
- Create `src/admin/AdminApp.tsx`: admin UI, loading/error/empty states, filters, detail dialog, install affordance, and notification controls.
- Create `src/admin/main.tsx`: React root and PWA registration entry.
- Create `src/admin/index.html`: admin metadata, manifest, icons, and module entry.
- Create `src/admin/admin.css`: isolated mobile-first admin styling.
- Create `public/admin/manifest.webmanifest`: standalone PWA identity and `/admin/` start/scope.
- Create `public/admin/sw.js`: admin-scoped install/activate/fetch handling and notification-click behavior.
- Create `tests/admin-bookings.test.ts`: deterministic domain behavior tests.
- Create `tests/admin-pwa.test.ts`: notification behavior and safe failure tests.
- Create `tests/admin-app.test.tsx`: user-visible UI and interaction tests.
- Create `tests/admin-build.test.mjs`: manifest, service-worker, HTML, and Vite build-boundary checks.
- Modify `vite.config.cjs`: add only the new admin HTML build input.

### Task 1: Deterministic fictional booking domain

**Files:**
- Create: `src/admin/bookings.ts`
- Test: `tests/admin-bookings.test.ts`

**Interfaces:**
- Consumes: `Date` supplied by callers; no environment, browser, or network state.
- Produces: `AdminBooking`, `BookingFilter`, `loadDemoBookings(now?: Date): Promise<AdminBooking[]>`, `filterBookings(bookings, filter, now?)`, `findNextBooking(bookings, now?)`, `formatBookingDate(startsAt)`, `formatBookingTime(startsAt)`, and `safeMeetingUrl(booking)`.

- [ ] **Step 1: Write the failing domain tests**

```ts
import { describe, expect, it } from "vitest";
import {
  filterBookings,
  findNextBooking,
  loadDemoBookings,
  safeMeetingUrl,
} from "../src/admin/bookings";

const now = new Date("2026-09-09T04:30:00.000Z");

describe("admin booking domain", () => {
  it("creates chronological fictional bookings relative to the supplied day", async () => {
    const bookings = await loadDemoBookings(now);
    expect(bookings.length).toBeGreaterThanOrEqual(5);
    expect(bookings.map((booking) => booking.startsAt)).toEqual(
      [...bookings].map((booking) => booking.startsAt).sort(),
    );
    expect(bookings.every((booking) => booking.isSample)).toBe(true);
  });

  it("finds the next actionable consultation and filters today", async () => {
    const bookings = await loadDemoBookings(now);
    expect(findNextBooking(bookings, now)?.status).toMatch(/confirmed|rescheduled/);
    expect(filterBookings(bookings, "today", now)).toHaveLength(2);
  });

  it("allows only HTTPS meeting links for active bookings", async () => {
    const bookings = await loadDemoBookings(now);
    const active = bookings.find((booking) => booking.status === "confirmed")!;
    const cancelled = bookings.find((booking) => booking.status === "cancelled")!;
    expect(safeMeetingUrl(active)?.protocol).toBe("https:");
    expect(safeMeetingUrl(cancelled)).toBeNull();
    expect(safeMeetingUrl({ ...active, meetingUrl: "javascript:alert(1)" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the domain test and confirm the missing-module failure**

Run: `npx vitest run tests/admin-bookings.test.ts`

Expected: FAIL because `src/admin/bookings.ts` does not exist.

- [ ] **Step 3: Implement the narrow domain module**

Implement the declared types and functions. Construct fictional dates with local calendar arithmetic relative to `now`, convert them to ISO strings, sort ascending once, and mark every record `isSample: true`. Include two appointments today plus past, upcoming, rescheduled, and cancelled examples. Use `Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"` for labels.

- [ ] **Step 4: Run the domain test**

Run: `npx vitest run tests/admin-bookings.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain slice**

```powershell
git add -- src/admin/bookings.ts tests/admin-bookings.test.ts
git commit -m "feat(admin): add sample booking domain"
```

### Task 2: Device-only PWA capability helpers

**Files:**
- Create: `src/admin/pwa.ts`
- Test: `tests/admin-pwa.test.ts`

**Interfaces:**
- Consumes: browser `window`, `navigator.serviceWorker`, and `Notification` APIs when present.
- Produces: `registerAdminServiceWorker(): Promise<ServiceWorkerRegistration | null>`, `requestNotificationPermission(): Promise<NotificationPermission | "unsupported">`, and `sendTestNotification(registration): Promise<"sent" | "denied" | "unsupported" | "unavailable">`.

- [ ] **Step 1: Write failing PWA helper tests**

```ts
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestNotificationPermission,
  sendTestNotification,
} from "../src/admin/pwa";

afterEach(() => vi.unstubAllGlobals());

describe("admin PWA notifications", () => {
  it("reports unsupported notification APIs", async () => {
    vi.stubGlobal("Notification", undefined);
    expect(await requestNotificationPermission()).toBe("unsupported");
  });

  it("sends the sample alert through the admin service worker", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    const showNotification = vi.fn().mockResolvedValue(undefined);
    expect(await sendTestNotification({ showNotification } as unknown as ServiceWorkerRegistration)).toBe("sent");
    expect(showNotification).toHaveBeenCalledWith(
      "Nakshatra Admin test",
      expect.objectContaining({ tag: "nakshatra-admin-test" }),
    );
  });
});
```

- [ ] **Step 2: Run the helper test and confirm failure**

Run: `npx vitest run tests/admin-pwa.test.ts`

Expected: FAIL because `src/admin/pwa.ts` does not exist.

- [ ] **Step 3: Implement feature-detected helpers**

Register `/admin/sw.js` with `{ scope: "/admin/" }`. Never throw a registration failure to the React entry. Request permission only after an explicit user action. Send the test with `registration.showNotification`, the 192px icon, `/admin/` data URL, and copy stating that sample notifications work on this device.

- [ ] **Step 4: Run the helper tests**

Run: `npx vitest run tests/admin-pwa.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the PWA helper slice**

```powershell
git add -- src/admin/pwa.ts tests/admin-pwa.test.ts
git commit -m "feat(admin): add local notification helpers"
```

### Task 3: Mobile-first admin appointments UI

**Files:**
- Create: `src/admin/AdminApp.tsx`
- Create: `src/admin/admin.css`
- Test: `tests/admin-app.test.tsx`

**Interfaces:**
- Consumes: optional `loadBookings`, `now`, and `serviceWorkerRegistration` props for deterministic testing; booking and PWA helpers from Tasks 1 and 2.
- Produces: default `AdminApp` React component and the complete sample-data appointments experience.

- [ ] **Step 1: Write failing interaction tests**

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import AdminApp from "../src/admin/AdminApp";
import { loadDemoBookings } from "../src/admin/bookings";

afterEach(cleanup);
const now = new Date("2026-09-09T04:30:00.000Z");

describe("Nakshatra Admin", () => {
  it("identifies sample data and prioritizes the next consultation", async () => {
    render(<AdminApp loadBookings={() => loadDemoBookings(now)} now={now} />);
    expect(await screen.findByText("Prototype — sample bookings")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Next consultation" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Join Google Meet" })).toBeTruthy();
  });

  it("filters today and opens booking details", async () => {
    const user = userEvent.setup();
    render(<AdminApp loadBookings={() => loadDemoBookings(now)} now={now} />);
    await screen.findByText("Prototype — sample bookings");
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getAllByRole("button", { name: /view .* details/i })).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: /view .* details/i })[0]);
    expect(screen.getByRole("dialog", { name: "Appointment details" })).toBeTruthy();
  });

  it("keeps appointments usable when the loader fails", async () => {
    render(<AdminApp loadBookings={() => Promise.reject(new Error("offline"))} now={now} />);
    expect(await screen.findByText("Appointments are unavailable right now.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the UI test and confirm failure**

Run: `npx vitest run tests/admin-app.test.tsx`

Expected: FAIL because `src/admin/AdminApp.tsx` does not exist.

- [ ] **Step 3: Implement the UI and its isolated styling**

Build semantic header, next-consultation section, two summary counts, three filter buttons, chronological appointment list, native `<dialog>`-semantics overlay or accessible `role="dialog"` panel, and a notification/install section. Use Lucide icons with text labels. Use 44px minimum interactive heights, fluid spacing, strong focus states, reduced-motion handling, and the approved ivory/ink/forest/ochre operational palette.

Ensure `Join Google Meet` uses `target="_blank"` and `rel="noreferrer"` only after `safeMeetingUrl` succeeds. Cancelled and completed rows have no meeting action. The notification panel must say `Device-only test. Live booking alerts are not connected yet.`

- [ ] **Step 4: Run the UI tests**

Run: `npx vitest run tests/admin-app.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the UI slice**

```powershell
git add -- src/admin/AdminApp.tsx src/admin/admin.css tests/admin-app.test.tsx
git commit -m "feat(admin): build mobile appointments prototype"
```

### Task 4: Installable isolated admin entry

**Files:**
- Create: `src/admin/main.tsx`
- Create: `src/admin/index.html`
- Create: `public/admin/manifest.webmanifest`
- Create: `public/admin/sw.js`
- Create: `tests/admin-build.test.mjs`
- Modify: `vite.config.cjs` in `build.rollupOptions.input`

**Interfaces:**
- Consumes: default `AdminApp` and `registerAdminServiceWorker` from earlier tasks.
- Produces: an independently built `/admin/index.html`, an admin-scoped manifest, and service worker.

- [ ] **Step 1: Write the failing boundary tests**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("admin manifest and worker stay inside the admin boundary", () => {
  const manifest = JSON.parse(readFileSync("public/admin/manifest.webmanifest", "utf8"));
  const worker = readFileSync("public/admin/sw.js", "utf8");
  const vite = readFileSync("vite.config.cjs", "utf8");
  assert.equal(manifest.start_url, "/admin/");
  assert.equal(manifest.scope, "/admin/");
  assert.match(worker, /\/admin\//);
  assert.match(vite, /admin:\s*resolve\(srcRoot, "admin\/index\.html"\)/);
});
```

- [ ] **Step 2: Run the boundary test and confirm failure**

Run: `node --test tests/admin-build.test.mjs`

Expected: FAIL because the manifest and service worker do not exist.

- [ ] **Step 3: Implement the admin entry and browser assets**

Use `/admin/main.tsx` as the admin HTML module source, link `/admin/manifest.webmanifest`, and set `theme-color` to the admin forest colour. Render `AdminApp` inside `StrictMode`; register the service worker after window load and pass failures through the UI-safe helper behavior.

The manifest must contain `name: "Nakshatra Admin"`, `short_name: "Nakshatra"`, `display: "standalone"`, `/admin/` start/scope, and existing `/brand/icon-192.png` and `/brand/icon-512.png` icons.

The service worker caches only `/admin/`, `/admin/manifest.webmanifest`, and existing brand icons during install. Its fetch handler responds only when `new URL(event.request.url).pathname.startsWith("/admin/")`; all other requests are untouched. Its notification click handler focuses or opens `/admin/`.

- [ ] **Step 4: Run focused boundary and build verification**

Run: `node --test tests/admin-build.test.mjs`

Expected: PASS.

Run: `npm run check`

Expected: PASS.

Run: `npm run build`

Expected: PASS with `dist/admin/index.html`, `dist/admin/manifest.webmanifest`, and `dist/admin/sw.js` present.

- [ ] **Step 5: Commit the installable entry**

```powershell
git add -- vite.config.cjs src/admin/main.tsx src/admin/index.html public/admin/manifest.webmanifest public/admin/sw.js tests/admin-build.test.mjs
git commit -m "feat(admin): add installable admin entry"
```

### Task 5: Full regression and Android-sized visual QA

**Files:**
- Modify only files from Tasks 1–4 if verification finds an acceptance failure.

**Interfaces:**
- Consumes: completed `/admin/` prototype.
- Produces: verification evidence; no new feature surface.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: all Node and Vitest tests pass, including existing landing, booking, scheduling, webhook, and availability tests.

- [ ] **Step 2: Start the local preview and inspect representative routes**

Run: `npm run dev -- --host 127.0.0.1`

Inspect `/admin/` at 390x844 and 412x915, then verify `/` and `/book/` still render. Confirm no horizontal overflow, all actions are at least 44px high, sample-data labelling is persistent, filters and detail dismissal work, and cancelled meetings cannot be opened.

- [ ] **Step 3: Exercise PWA behavior on HTTPS or localhost**

Confirm the manifest loads, the installed scope remains `/admin/`, notification denial does not block appointments, and an allowed local test produces exactly one `Nakshatra Admin test` notification. Do not claim background push delivery.

- [ ] **Step 4: Run final repository checks**

Run: `npm run check`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

Run: `git status --short`

Expected: only pre-existing unrelated work remains outside the prototype commits.

- [ ] **Step 5: Stop at the approved prototype boundary**

Report the `/admin/` preview path, tests run, visual QA sizes, and the explicit deferred items: authentication, Northflank storage/API, Cal ID webhook activation, and live push notifications.
