# Cal ID three-reading local QA record

Date: 8 September 2026
Environment: Windows, Vite 7.3.1, React 18.3.1, Codex in-app browser
Local preview: `http://127.0.0.1:4173/`

## Automated gate

| Command | Result |
| --- | --- |
| `npm run check` | Exit 0; TypeScript emitted no diagnostics. |
| `npm test` | Exit 0; production build passed, Node tests 12/12 passed, Vitest tests 47/47 passed. |
| `npm run build` | Exit 0; Vite transformed 1,754 modules and emitted both HTML entries. |

The suite covers the exact service catalogue, hash-only selection, click and history-style hash changes, URL validation, future-token isolation, direct-event resolution and defaults, booking-page rendering, shell/metadata, responsive frame heights, focus/contrast, production headers, Vite configuration, and every Kundli asset's PNG dimensions and alpha channel.

## Responsive matrix

The in-app browser viewport capability was used for each requested size. The browser reserves 15 px for its scrollbar, so the document client width is 15 px below the requested outer width. `scrollWidth` equalled `clientWidth` at every size.

| Requested viewport | Client and scroll width | Landing | Booking |
| ---: | ---: | --- | --- |
| 375 × 812 | 360 / 360 px | Three cards present; no horizontal overflow | Best Date active; direct event; no token; no iframe scroll |
| 768 × 900 | 753 / 753 px | Three cards present; no horizontal overflow | Best Date active; direct event; no token; no iframe scroll |
| 1024 × 900 | 1009 / 1009 px | Three cards present; no horizontal overflow | Best Date active; direct event; no token; no iframe scroll |
| 1440 × 1024 | 1425 / 1425 px | Three cards present; no horizontal overflow | Best Date active; direct event; no token; no iframe scroll |

The 375 px landing and booking headers were visually inspected, including the Kundli mark, Menu, Book action, multi-line editorial H1, service choices, active service, and booking facts. The 1440 px landing hero was compared directly beside the live Starheal reference using the same viewport override.

## Verified interaction path

- The three landing-card actions route to `/book/#personal-consultation`, `/book/#relationship-consultation`, and `/book/#best-date-analysis`.
- Clicking Best Date Analysis updated the browser hash, accessible active state, selected duration/price/preparation, iframe source, and direct fallback link.
- The exact event-specific iframe sources are:
  - `https://cal.id/nilima-sawane/personal-consultation?duration=60`
  - `https://cal.id/nilima-sawane/relationship-consultation?duration=60`
  - `https://cal.id/nilima-sawane/best-date-analysis?duration=30`
- `/book/?s=opaque-test-token#best-date-analysis` kept the token in the visitor-facing URL but did not render it or forward it to Cal ID.
- The iframe carries `scrolling="no"`; the main document owns the visible scrollbar. The direct event has a 960 px desktop height and a 1500 px narrow-screen height.
- Relationship Consultation exposed Asia/Kolkata, Google Meet, ₹1,000, live dates, and time slots.
- A Relationship time slot was selected to open the attendee form. Name, email, notes, guest, Terms, Privacy Policy, Back, and Pay to book controls were visible. No customer data was entered and no booking or payment was submitted.
- Browser diagnostics returned no warning or error whose source URL was the local application.

Cal ID's third-party scripts emitted their own `markdownToSafeHTML`, i18n, Zustand deprecation, dialog-label, and query-debug console messages. These messages originate on `https://cal.id/`; they are not evidence of a local React failure, but the dialog accessibility warning should be monitored when the official Inline embed is reviewed.

## Cal ID dashboard discrepancies

The public event pages are live, but the current Cal ID dashboard state is not launch-ready:

- Personal Consultation shows 60 minutes and ₹500. Duration is correct; price must become ₹1,000.
- Relationship Consultation shows 60 minutes and ₹1,000. Both match.
- Best Date Analysis shows 30 minutes and ₹1,000. Duration is correct; price must become ₹500.
- Cal ID still renders in a dark theme with pink controls, which does not match the website's paper/forest/ochre system.
- Nilima's current Cal ID avatar is a photo collage, not the supplied Kundli identity.

Required dashboard changes are Light appearance, Column mobile layout, `#2F5D50` primary colour, `public/brand/cal-id-logo-600x400.png` logo, and `public/brand/icon-512.png` favicon.

## Remaining production gates

- Correct the two Cal ID amounts and repeat the public-page check.
- Apply the Cal ID appearance and brand assets, then repeat desktop/mobile visual comparison.
- Copy the exact Inline code for each event from its Embed tab and review it before replacing the raw iframe fallback or changing CSP.
- Approve cancellation, rescheduling, refund, privacy, and consultation-scope policies.
- Confirm the final booking questions and whether any notes, recording, chart copy, or written date recommendation are included.
- Complete a controlled owner-approved payment for each distinct price, verify exactly one Cal ID booking and Google Meet event, reconcile Razorpay, and test failure/cancellation without creating a booking.
- Verify confirmation, reminders, rescheduling, cancellation, refund, mobile Cal ID access, Google Calendar conflict checking, and timezone conversion.
- Supply a genuine Nilima portrait, method/tradition, training, experience, and languages only if those details should be published.
- Perform a clean dependency install and generate/review a lockfile when registry access is available.

## Handoff state

The Vite development server is running on `127.0.0.1:4173`. `.env.local` contains the three exact public event URLs and remains gitignored. The website code, examples, and QA records contain no secret credentials.
