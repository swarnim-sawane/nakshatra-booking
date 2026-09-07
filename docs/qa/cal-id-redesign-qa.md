# Cal ID redesign local QA record

Date: 7 September 2026
Environment: Windows, Node.js 22.12.0, Vite 7.3.1, React 18.3.1, Codex in-app browser
Local preview: `http://127.0.0.1:4173/`

## Automated gate

The commands were run separately before browser QA and repeated separately after all QA fixes:

| Command | Result |
| --- | --- |
| `npm run check` | Exit 0; TypeScript emitted no diagnostics. |
| `npm test` | Exit 0; production build completed, Node tests 5/5 passed, Vitest tests 18/18 passed. |
| `npm run build` | Exit 0; Vite transformed 1751 modules and emitted both `index.html` and `book/index.html`. |

After the density fix, the focused CSS regression test also passed 1/1. The parent agent requested that no further full checks be run before the scoped commit; the full-gate counts above therefore record the immediately preceding separate run.

The first preview attempt exposed an environment-specific Vite cache failure because the gitignored `node_modules` path is a junction outside this workspace. A failing regression test was recorded, `vite.config.cjs` was changed to use the local `.vite-cache`, and the focused Node test then passed 3/3. The persistent Vite server started successfully afterward.

## Screenshot matrix

The viewport capability controls the in-app browser's outer size. Its chrome and vertical scrollbar reduce the honest captured content dimensions; both requested and captured dimensions are recorded instead of padding or stretching evidence.

| Route | State | Requested outer viewport | Captured pixels | Result | Evidence |
| --- | --- | ---: | ---: | --- | --- |
| `/` | Landing, post-density fix | 1440 × 1024 | 1425 × 970 | Pass | `docs/qa/screenshots/landing-desktop-1440x1024.jpg` |
| `/book/` | Safe unconfigured booking state | 1440 × 1024 | 1425 × 970 | Pass | `docs/qa/screenshots/book-desktop-1440x1024.jpg` |
| `/` | Landing, post-density fix | 390 × 844 | 375 × 812 | Pass | `docs/qa/screenshots/landing-mobile-390x844.jpg` |
| `/book/` | Safe unconfigured booking state | 390 × 844 | 375 × 812 | Pass | `docs/qa/screenshots/book-mobile-390x844.jpg` |

The normalized visual comparison is `docs/qa/option-3-vs-landing-desktop.png`; its focused hero inspection is `docs/qa/option-3-vs-landing-hero-focus.png`. The initial P2 first-fold density drift was corrected and the second comparison found no remaining P0/P1/P2 issue. See the project-root `design-qa.md` for full findings and normalization details.

## Interaction, responsive, console, and accessibility evidence

- All seven rendered booking links use `/book/`; the mobile Book action navigated successfully.
- About, The consultation, and FAQs anchors reached `#about`, `#consultation`, and `#faqs`.
- The mobile Menu opened by click and by keyboard and exposed the three navigation links.
- The first FAQ expanded and collapsed, with its answer entering and leaving the accessibility tree.
- Keyboard focus exposed the skip link clearly; Enter moved focus to the main content.
- `/book/?s=opaque-test-token` showed the safe unconfigured heading while rendering zero token-text matches, zero iframes, and zero external `cal.id`/`app.cal.id` links.
- Desktop body and document `scrollWidth` equalled `clientWidth` at 1425 px. Mobile screenshots show no clipped header, primary action, or content edge.
- The landing and booking pages preserve one H1 each, semantic navigation/landmarks, visible focus, 44 px minimum targets, and reduced-motion support.
- Browser diagnostics returned zero warning or error entries after the walkthrough.
- No live Cal ID page, booking, payment, Google Meet, cancellation, refund, deployment, or WhatsApp action was opened or attempted.

Residual P3 observations are limited to offline system-font fallbacks and the mobile native menu remaining open after an in-page anchor selection. Neither blocks the path to `/book/`; both are documented in `design-qa.md`.

## External production gates

Local evidence does not establish production acceptance. Before launch, complete and verify all of the following:

- Supply the owner's real Cal ID event URL and re-run the configured embed/fallback browser pass.
- Confirm the real duration, price, currency, tax treatment, business name, biography, portrait, contact details, and support path.
- Connect the owner's Google Calendar for conflict checking and Google Meet for meeting creation.
- Configure real availability, buffers, booking limits, attendee questions, consent, confirmation, reminders, cancellation, rescheduling, and refund rules in Cal ID.
- Supply and review cancellation, refund, privacy, and consultation-scope policies.
- Complete Razorpay KYC and Live Mode activation, then verify a controlled payment, server-side signature/webhook handling, idempotency, refund, and operational reconciliation.
- Verify Cal ID webhooks before treating browser redirects or UI messages as authoritative booking/payment confirmation.
- Implement WhatsApp automation only as the later phase described in the design specification, using opaque, expiring, hashed session tokens and signed/idempotent webhooks.
- Perform a clean dependency install and generate/review a lockfile once package-registry access is available.

## Handoff state

The Vite development server remains running on `127.0.0.1:4173`, and the local landing page is left open in the Codex in-app browser. The booking route remains intentionally unconfigured until the owner supplies the real Cal ID event URL.
