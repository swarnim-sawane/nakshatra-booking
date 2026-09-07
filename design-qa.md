# Design QA — Cal ID booking redesign

Date: 7 September 2026

## Comparison target

- Source visual truth: `docs/design/option-3-booking-first-concierge.png`
- Source pixels: 1488 × 1056.
- Implementation screenshot: `docs/qa/screenshots/landing-desktop-1440x1024.jpg`
- Route and state: `/`, light appearance, signed-out public landing page, first-load state; no live Cal ID event is configured.
- Requested Codex in-app browser outer viewport: 1440 × 1024 CSS px.
- Honest browser content capture: 1425 × 970 pixels. The in-app browser reserved 15 px for the vertical scrollbar and 54 px for browser chrome.
- Density: one screenshot pixel per captured CSS pixel; no double-density scaling was applied.
- Normalization: the source was centre-cropped from 1488 × 1056 to 1488 × 1013 and resized to 1425 × 970. The implementation remained at its native 1425 × 970 capture.
- Full comparison board: `docs/qa/option-3-vs-landing-desktop.png` (2850 × 970; normalized source left, implementation right).
- Focused hero comparison: `docs/qa/option-3-vs-landing-hero-focus.png` (2850 × 700; source left, implementation right).

## Findings

No actionable P0, P1, or P2 finding remains after the second comparison pass.

The full comparison confirms that the warm paper/surface balance, black pill actions, ochre labels, serif-led hierarchy, two-column composition, quiet one-pixel borders, and consultation imagery preserve the approved Option 3 direction. The generated image is sharp, naturally cropped, correctly integrated into its panel, and uses no CSS art or placeholder illustration.

The approved source shows a fictional live calendar. The implementation intentionally replaces it with the consultation image, truthful booking summary, and “Live availability on the booking page” status. This is an accepted product constraint: local QA used the safe unconfigured state and did not invent slots, price, or payment acceptance.

The focused comparison confirms readable heading wraps, aligned factual rows, consistent icon stroke weight, clear action hierarchy, and unchanged touch-target sizing after the density fix.

### Follow-up polish (P3)

- The current offline environment cannot provide the specified Newsreader and Manrope font files. Georgia and Segoe UI/system fallbacks preserve the hierarchy but have slightly different optical weight and spacing. Self-host and re-check the approved fonts once registry access is available.
- Selecting an in-page link from the native mobile `<details>` menu moves to the correct section but leaves the disclosure open until the visitor closes it or changes page. This does not block navigation or the visible mobile booking action, but auto-closing it would be a small refinement.

## Comparison history

### Pass 1 — blocked by one P2 density mismatch

- Finding: the reference introduced the next content section around y≈770 in the normalized view, while the first implementation kept the landing hero to about y≈966. The missing next-section cue made the first fold feel more isolated and vertically looser than the approved direction.
- Fix: in `src/styles/landing.css`, desktop hero padding changed from 64/96 px to 48/64 px, preview image height from 310 px to 280 px, preview body gap from 24 px to 16 px, and maximum body padding from 40 px to 32 px. Text sizes, content order, and interactive target sizes were not reduced.

### Pass 2 — passed

- Post-fix evidence: `docs/qa/screenshots/landing-desktop-1440x1024.jpg` and `docs/qa/option-3-vs-landing-desktop.png`.
- Result: the next consultation-section cue now begins around y≈843 in the honest capture, within the intended 850–900 px range. The hero remains spacious and the card, image, text, status, icons, and both primary actions remain fully visible.
- Mobile evidence: `docs/qa/screenshots/landing-mobile-390x844.jpg` confirms the 390 × 844 requested outer viewport still has a readable four-line heading, full-width primary action, visible Menu and Book controls, and no visible horizontal clipping.

## Interaction and accessibility evidence

- Keyboard Tab exposed a high-contrast skip link with a two-tone focus treatment; Enter moved focus to `main-content`.
- The mobile Menu opened by pointer and keyboard and exposed About, The consultation, and FAQs.
- Header anchors navigated to `#about`, `#consultation`, and `#faqs`.
- The first FAQ expanded and collapsed as a semantic disclosure, and the answer appeared in the accessibility tree.
- Seven booking links resolve to `/book/`; the visible mobile Book action successfully opened the booking route.
- `/book/?s=opaque-test-token` retained the public URL while rendering no token text, iframe, or external Cal ID link in the unconfigured state.
- Desktop measurement recorded body/document `scrollWidth` equal to `clientWidth` at 1425 px. Mobile captures show the full header, primary action, and right edge without horizontal clipping.
- Browser warning/error log query returned an empty list after the route and interaction walkthrough.
- Reduced-motion rules, semantic headings/landmarks, accessible image text, 44 px minimum targets, and visible focus styling are present.

final result: passed
