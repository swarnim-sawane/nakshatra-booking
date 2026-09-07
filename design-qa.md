# Design QA — Cal ID booking redesign

Date: 7 September 2026

## Comparison target

- Source visual truth: `docs/design/option-3-booking-first-concierge.png`
- Source pixels: 1487 × 1058.
- Implementation screenshot: `docs/qa/screenshots/landing-desktop-1440x1024.jpg`
- Route and state: `/`, light appearance, signed-out public landing page, first-load state. Nilima Sawane's public Cal ID profile is connected on `/book/`; the dedicated astrology event is not yet configured in Cal ID.
- Requested Codex in-app browser outer viewport: 1440 × 1024 CSS px.
- Honest browser content capture: 1425 × 970 pixels. The in-app browser reserved 15 px for the vertical scrollbar and 54 px for browser chrome.
- Density: one screenshot pixel per captured CSS pixel; no double-density scaling was applied.
- Normalization: the source was centre-cropped at `x=0, y=23` from 1487 × 1058 to 1487 × 1012, then resized to 1425 × 970. The implementation remained at its native 1425 × 970 capture.
- Full comparison board: `docs/qa/option-3-vs-landing-desktop.png` (2850 × 970; normalized source left, implementation right).
- Focused hero comparison: `docs/qa/option-3-vs-landing-hero-focus.png` (2850 × 700; source left, implementation right).

## Findings

No actionable P0, P1, or P2 finding remains after the final comparison pass.

The full comparison confirms that the warm paper/surface balance, black pill actions, accessible text-specific ochre labels, serif-led hierarchy, two-column composition, quiet one-pixel borders, and consultation imagery preserve the approved Option 3 direction. The generated image is sharp, naturally cropped, correctly integrated into its panel, and uses no CSS art or placeholder illustration.

The approved source shows a fictional live calendar. The landing page intentionally replaces it with the consultation image, truthful booking summary, and “Live availability on the booking page” status. The separate `/book/` route now embeds Nilima Sawane's real public Cal ID profile; the website still invents no slots, price, payment, or confirmation state.

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
- Result: the next consultation-section cue now begins around y≈843 in the honest capture, restoring the intended first-fold rhythm near the requested 850–900 px target. The hero remains spacious and the card, image, text, status, icons, and both primary actions remain fully visible.
- Mobile evidence: `docs/qa/screenshots/landing-mobile-390x844.jpg` confirms the 390 × 844 requested outer viewport still has a readable four-line heading, full-width primary action, visible Menu and Book controls, and no visible horizontal clipping.

### Final accessibility and fallback pass — passed

- A darker `--color-ochre-text` value of `#875d24` now gives 5.24:1 contrast on paper and 5.70:1 on the light surface. Decorative icons, borders, and large step numbers retain the original ochre.
- The About section uses the dedicated warm on-dark label token `#b5833b`, measured at 5.23:1 against its `#1c1915` ink background. This section is below the canonical first fold, so the scoped correction does not change either comparison board's pixels.
- The white final-booking action now has a two-tone surface/ink focus ring. The focused mobile state was inspected in the Codex in-app browser and remained clearly separated from the forest panel without clipping.
- A configured Cal ID embed always presents both Retry and the direct Cal ID link. Retry remounts only a newly revalidated URL; no cross-origin iframe error or success inference controls the fallback.
- Explicit default ports (`:443`) now fail closed for both allowed Cal ID hosts, alongside custom ports and credentials.
- All four canonical screenshots were refreshed after the label-color change. Both comparison boards were rebuilt from the verified 1487 × 1012 centre crop and inspected together; the visual verdict remains passed.

## Interaction and accessibility evidence

- Keyboard Tab exposed a high-contrast skip link with a two-tone focus treatment; Enter moved focus to `main-content`.
- The final-booking action's two-tone focus treatment was visibly distinct against the forest panel in the mobile in-app-browser inspection.
- The mobile Menu opened by pointer and keyboard and exposed About, The consultation, and FAQs.
- Header anchors navigated to `#about`, `#consultation`, and `#faqs`.
- The first FAQ expanded and collapsed as a semantic disclosure, and the answer appeared in the accessibility tree.
- Seven booking links resolve to `/book/`; the visible mobile Book action successfully opened the booking route.
- `/book/?s=opaque-test-token` retained the public URL while rendering Nilima Sawane's Cal ID profile from the unchanged `https://cal.id/nilima-sawane` iframe source. The opaque token was neither displayed nor forwarded.
- Desktop measurement recorded body/document `scrollWidth` equal to `clientWidth` at 1425 px. Mobile captures show the full header, primary action, and right edge without horizontal clipping.
- Browser warning/error log query returned an empty list after the route and interaction walkthrough.
- Reduced-motion rules, semantic headings/landmarks, accessible image text, 44 px minimum targets, visible focus styling, and WCAG-AA small-label contrast are present.

final result: passed
