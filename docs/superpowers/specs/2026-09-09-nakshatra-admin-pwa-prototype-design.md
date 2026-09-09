# Nakshatra Admin PWA prototype design

Date: 9 September 2026

## Decision

Build a private-operations prototype at `/admin/` inside the existing Nakshatra React/Vite repository. The prototype is a separate mobile-first entry point that uses fictional bookings and a replaceable data adapter. It does not connect to Cal ID, Northflank, Strapi, Firebase, Razorpay, or any real customer data.

The working product name is **Nakshatra Admin**. The first user is Nilima on Android, so the experience must prioritize the next consultation and quick access to its Google Meet link over desktop-style administration.

## Why this approach

Keeping the prototype in the website repository lets it reuse the established Nakshatra brand, build system, icons, and Vercel preview workflow. A separate `/admin/` entry prevents private operational UI from becoming part of the customer-facing page hierarchy.

The data boundary must remain replaceable. The prototype reads from a local demo provider through the same small interface a future authenticated Northflank endpoint can implement. This validates the mobile experience without prematurely coupling Nakshatra to the unrelated artwork Strapi application.

## Prototype experience

The first release has one primary appointments screen and one lightweight notification/settings surface.

### Appointments

- Identify the screen as `Nakshatra Admin` and visibly label it `Prototype — sample bookings`.
- Highlight the next confirmed consultation with service, customer first name, date, local time, countdown context, status, and a prominent `Join Google Meet` action.
- Show compact `Today` and `Upcoming` counts.
- List bookings in chronological order with `Confirmed`, `Rescheduled`, `Cancelled`, or `Completed` status.
- Allow the operator to filter the list by `Upcoming`, `Today`, and `All`.
- Open an accessible booking detail panel with the fictional booking reference, service, customer first name, time, status, and meeting action.
- Never display birth details, consultation questions, payment metadata, or sensitive notes.

### Installation and notifications

- Supply an admin-scoped web app manifest using the existing Nakshatra icons, standalone display mode, brand colours, and `/admin/` start URL.
- Register a service worker scoped only to `/admin/`; it must not control `/` or `/book/`.
- Show an install action only when the browser provides an install prompt. Otherwise provide brief Android installation guidance.
- Let the operator request notification permission and send one local test notification through the service worker.
- State clearly that the test notification is device-only and that live booking alerts are not connected yet.
- Handle unsupported browsers and denied notification permission without blocking appointment viewing.

## Architecture and files

The admin prototype is a separate Vite multi-page entry:

```text
src/admin/index.html
src/admin/main.tsx
src/admin/AdminApp.tsx
src/admin/admin.css
src/admin/bookings.ts
public/admin/manifest.webmanifest
public/admin/sw.js
tests/admin-app.test.tsx
```

`vite.config.cjs` gains only the `admin` HTML input. Existing customer routes and their application entry remain unchanged.

`bookings.ts` owns the small domain model and exposes an asynchronous loader. Version one returns fictional records. A later implementation can call an authenticated endpoint without changing the visual components.

The data shape is intentionally narrow:

```ts
type AdminBooking = {
  id: string;
  customerFirstName: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  timezone: "Asia/Kolkata";
  status: "confirmed" | "rescheduled" | "cancelled" | "completed";
  meetingUrl?: string;
};
```

No provider-specific payload is allowed in the UI model. Cal ID identifiers and webhook event metadata remain backend concerns.

## Visual direction

- Use Nakshatra's existing ivory, ink, forest, and ochre palette, with the current Kundli icon.
- Optimize for a 360–430 pixel Android viewport with large touch targets and readable local times.
- Keep the dashboard calm and operational: one dominant next-appointment card, simple counts, and a chronological list.
- Avoid dense tables, tiny controls, decorative gradients, mystical imagery, and excessive cards.
- Use plain, reassuring labels suitable for someone who checks appointments between other phone activity.

## State and failure handling

- Show deliberate loading, empty, and unavailable states from the booking loader.
- Keep cancelled bookings visually distinct and disable their meeting actions.
- Treat malformed meeting URLs as unavailable; only HTTPS meeting links may be opened.
- If notification permission is denied, explain how it can be restored from browser settings.
- If service-worker registration fails, keep the booking prototype usable and show that notifications are unavailable.
- Demo dates should be generated relative to the current day so the next-appointment and Today views remain meaningful.

## Privacy and security boundary

- All prototype people, references, and appointments are fictional and explicitly labelled as sample data.
- Do not include API keys, backend URLs, authentication tokens, real phone numbers, email addresses, or customer birth information.
- The prototype does not claim to be access-controlled. It may be previewed on Vercel only because it contains no real data.
- Real booking data must not be connected until the app has server-validated authentication, an authenticated backend endpoint, least-data responses, and logout/session-expiry behavior.
- Live push payloads must eventually contain only a generic appointment alert or minimal booking summary; sensitive consultation information must be fetched after authentication.

## Deferred production connection

Northflank exploration happens after the prototype is accepted. The preferred future flow is:

```text
Cal ID signed webhook
  -> durable booking projection on Northflank
  -> authenticated `/api/admin/bookings`
  -> minimal Android push event
  -> Nakshatra Admin refreshes booking details after sign-in
```

The exploration must determine whether the current free Northflank resources can safely host an isolated Nakshatra module or process. The existing artwork Strapi data model must not be changed merely to save hosting cost. Vercel remains sufficient for hosting the static prototype.

## Explicit non-goals

- No live Cal ID webhook registration or webhook-store adapter.
- No change to Cal ID, Google Calendar, Razorpay, email, or WhatsApp settings.
- No real push subscription, Firebase setup, background delivery, or notification scheduling.
- No authentication implementation or real customer information.
- No booking creation, rescheduling, cancellation, payment, marketing, analytics, or customer messaging from the admin app.
- No Northflank or Strapi deployment changes.

## Verification and acceptance

- `npm run check`, the focused admin tests, and `npm run build` pass.
- Vite emits an independently loadable `/admin/` page while `/` and `/book/` continue to build unchanged.
- The page works at representative Android sizes and remains usable with notifications denied or unavailable.
- Filters, booking details, valid meeting actions, install guidance, notification permission, and local test notification behavior are exercised.
- Manifest icons resolve, the start URL is `/admin/`, and the service worker is limited to the admin scope.
- The screen always identifies sample data and never implies that live Cal ID notifications are active.

Implementation stops when this prototype is locally verified and visually reviewed. Backend selection, authentication, durable storage, and live push delivery require a separate approved design after Northflank is inspected.
