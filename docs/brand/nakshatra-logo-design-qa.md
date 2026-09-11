# Design QA — Nakshatra logo

Date: 8 September 2026

## Visual reference

- Selected reference: `docs/brand/nakshatra-selected-logo-reference.png`.
- Production use removes the ivory presentation sheet and duplicate corner preview.
- The live header uses the upright Kundli mark beside a restrained Times New Roman wordmark.

## Refinements verified

- The Kundli chart is upright and no longer reads as tilted to the left.
- The mark is reduced to a supporting scale and optically aligned with the capital N.
- The 11 px desktop gap keeps the mark and wordmark connected without crowding.
- The ochre centre point remains visible without competing with the name.
- The transparent dark, reversed, and monochrome exports retain the approved proportions.
- The compact header version remains legible against the ivory navigation background.
- Header and footer expose a single accessible Nakshatra label; the decorative mark is hidden from assistive technology.

## Evidence

- The production preview was inspected in the Codex in-app browser at desktop width.
- `tests/brand-assets.test.mjs` verifies dimensions and transparency for the logo pack.
- `tests/shell.test.tsx` verifies that the mark and wordmark render in both header and footer.

final result: passed
