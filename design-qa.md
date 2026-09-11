# Nakshatra editorial refinement design QA

Date: 9 September 2026
Interim evidence status: pending root-session in-app-browser recapture and comparison

## Current gate

- Desktop hierarchy: pending post-fix recapture
- Mobile hierarchy and two-column facts: pending post-fix recapture
- Calendar success, empty month, and replacement fallback: pending post-fix recapture
- About portrait motion and reduced-motion behavior: pending post-fix recapture
- Header/footer social controls: pending post-fix recapture, including required footer evidence
- 404 recovery: pending post-fix recapture
- Keyboard focus and console: pending post-fix recheck

The five supplied screenshots are problem-state evidence, not desired pixel-perfect mocks. The approved visual truth is `C:\Users\ssawane\Downloads\Astro booking - Copy\docs\superpowers\specs\2026-09-08-sitewide-editorial-refinement-design.md`.

Review round 1 found actionable P2 issues. The code corrections and automated verification are complete, but final Product Design acceptance must wait until the root session captures the rebuilt implementation in the required in-app browser, combines each source and matching implementation state into one board, and opens every board for review.

## Superseded evidence and decoded dimensions

The earlier implementation captures and comparison boards are retained as iteration history only. Their actual PNG dimensions were decoded with `System.Drawing.Image`; filename suffixes and requested CSS viewport values are not image-dimension evidence. CUA did not expose `devicePixelRatio`, so no 1:1, native-density, or exact-DPR claim is made.

| Artifact | Decoded PNG pixels | Requested CSS viewport or crop | Status |
| --- | ---: | --- | --- |
| `source-problem-1.png` | 1798 x 889 | supplied problem crop | source truth; density unknown |
| `implementation-service-cards-1798x889.png` | 1654 x 882 | requested 1798 x 889 | superseded; crop does not match source |
| `comparison-1-service-cards.png` | 1854 x 574 | normalized board | invalid for final judgment because its two panels show different crops |
| `source-problem-2.png` | 1909 x 689 | supplied problem crop | source truth; density unknown |
| `implementation-consultation-heading-1909x689.png` | 1654 x 684 | requested 1909 x 689 | superseded pre-fix capture |
| `comparison-2-consultation-hierarchy.png` | 1854 x 466 | normalized board | superseded pre-fix comparison |
| `source-problem-3.png` | 824 x 656 | supplied partial mobile crop | source truth; density unknown |
| `implementation-mobile-error-facts-412x844.png` | 397 x 813 | requested 412 x 844 | superseded pre-fix capture |
| `comparison-3-mobile-error-facts.png` | 878 x 938 | normalized board | superseded pre-fix comparison |
| `source-problem-4.png` | 1863 x 997 | supplied problem viewport | source truth; density unknown |
| `implementation-home-error-1863x997.png` | 1682 x 989 | requested 1863 x 997 | superseded pre-fix capture |
| `comparison-4-desktop-error-page.png` | 1854 x 623 | normalized board | superseded pre-fix comparison |
| `source-problem-5.png` | 1061 x 752 | supplied focused crop | source truth; density unknown |
| `implementation-calendar-error-focused-720x643.png` | 720 x 643 | focused implementation crop | superseded pre-fix capture |
| `comparison-5-calendar-error-focused.png` | 1854 x 898 | normalized board | superseded pre-fix comparison |

Other superseded capture dimensions: booking desktop 1425 x 891; booking mobile 397 x 813; calendar success 1425 x 891; consultation hierarchy 1654 x 684; keyboard focus 397 x 813; mobile About 397 x 813; mobile FAQ 397 x 813; mobile menu 397 x 813; mobile 390 fallback 375 x 812; 404 1425 x 891. The embedded 96-DPI PNG metadata is not treated as browser DPR.

## Required post-fix capture matrix

Use the rebuilt production assets and the Codex in-app browser only.

| State | Requested CSS viewport | Required implementation filename | Comparison |
| --- | ---: | --- | --- |
| Consultation card row, cropped to the same card-only region as source 1 | 1798 x 889 | `implementation-service-cards-postfix.png` | rebuild `comparison-1-service-cards-postfix.png` |
| Consultation eyebrow, heading, lead, and opening of the same content region as source 2 | 1909 x 689 | `implementation-consultation-hierarchy-postfix.png` | rebuild `comparison-2-consultation-hierarchy-postfix.png` |
| Mobile hero with two-column facts and full fallback state matching source 3 | 412 x 844 | `implementation-mobile-error-facts-postfix.png` | rebuild `comparison-3-mobile-error-facts-postfix.png` |
| Desktop hero and full calendar fallback matching source 4 | 1863 x 997 | `implementation-home-error-postfix.png` | rebuild `comparison-4-desktop-error-page-postfix.png` |
| Focused desktop fallback panel matching source 5 | 1863 x 997, focused crop | `implementation-calendar-error-focused-postfix.png` | rebuild `comparison-5-calendar-error-focused-postfix.png` |
| Hero primary and secondary actions | 1440 x 900 | `implementation-hero-actions-postfix.png` | implementation evidence |
| Mobile menu open with socials inside its single panel | 412 x 844 | `implementation-mobile-menu-postfix.png` | implementation evidence |
| About portrait and fully visible caption after reveal | 412 x 844 | `implementation-mobile-about-postfix.png` | implementation evidence |
| Empty month with both button-style actions | 412 x 844 | `implementation-calendar-empty-postfix.png` | implementation evidence |
| 404 recovery state with display heading | 1440 x 900 | `implementation-not-found-postfix.png` | implementation evidence |
| Footer with brand, real social icons, and practice links | 1440 x 900 | `implementation-footer-postfix.png` | required footer evidence |
| Keyboard focus on a primary control | 412 x 844 | `implementation-keyboard-focus-postfix.png` | interaction evidence |

For every combined board, decode both input PNGs, scale them proportionally into equal-width panels, label source and implementation, and record the actual decoded input/output pixels. Do not infer DPR from filename, requested viewport, or 96-DPI metadata. Comparison 1 must use a card-only implementation crop so both panels show the same content region.

## Review-round findings and fixes

- [P2] Hero secondary action looked like a purple underlined text link. Fixed in `Hero.tsx` and `landing.css`: it now uses the established secondary-button component styling, retains `href="#consultation"`, and has no link-like underline/accent override.
- [P2] Mobile socials formed a detached nested navigation popup. Fixed in `SocialLinks.tsx`, `Header.tsx`, and `global.css`: the mobile instance is an accessible `role="group"` inside the one mobile-navigation panel, while desktop and footer instances remain semantic navigation landmarks. CSS now targets only `.mobile-navigation > nav` and its direct navigation links.
- [P2] The 404 heading inherited the body family. Fixed in `global.css` with the established display family and editorial weight 500.
- [P2] Portrait and caption revealed as one object. Fixed in `MeetNilima.tsx`: semantic `figure` contains an independently revealed `motion.img`, followed by a semantic `motion.figcaption` delayed by 140 ms. `MotionConfig reducedMotion="user"` remains the global reduced-motion contract.
- [P2] Empty-month state exposed only a text continuation. Fixed in `AvailabilityCalendar.tsx` and its stylesheet: it now provides secondary `Check next month` and primary `View all available times` buttons. The in-place action advances `visibleMonth`, which triggers the existing validated monthly fetch; external handoff still uses only `parseCalIdBookingUrl` output and fails closed when invalid.
- [P2] Earlier evidence overstated dimensions/DPR and comparison 1 mismatched crops. Corrected above; all post-fix boards remain pending.
- [P2] Footer screenshot evidence was absent. Added to the required post-fix capture matrix.

## Required fidelity surfaces — pending visual confirmation

- Fonts and typography: verify Cinzel display use/weight for the 404 and all headings, Poppins body rendering, wrapping, line height, tracking, and optical hierarchy.
- Spacing and layout rhythm: verify the hero actions, single mobile navigation panel, service-card card-only crop, caption spacing, empty-state action spacing, and footer alignment without overflow.
- Colors and tokens: verify ivory/ink/ochre/pale-lilac mapping, neutral prominent actions, contrast, hover/focus treatment, and absence of purple underlined in-content actions.
- Image quality and asset fidelity: verify Nilima's real portrait crop/sharpness, three real consultation photographs, the Kundli mark, and real icon-library social icons.
- Copy and content: verify approved first-person About copy, full caption, empty/error messaging, unchanged service facts, and 404 recovery labels.
- Icons and controls: verify social icons remain aligned and named, calendar chevrons remain usable, both empty-state actions have 44px-class targets, and the mobile menu does not create a second surface.

## Automated and environment evidence

- `npm run check`: passed on 9 September 2026.
- `npm test`: passed after the corrections — clean build, 23/23 Node tests, and 69/69 Vitest tests.
- `git diff --check`: passed; only existing Windows LF-to-CRLF notices were printed.
- Warning suppression remains narrow: only known `MODULE_LEVEL_DIRECTIVE` noise from `lucide-react` and `framer-motion` is suppressed; tests still prove unrelated warnings are forwarded.
- `.env.local` is present and populated, including the server-side Cal ID key, but `vite preview` serves built assets and does not execute Vite's dev-only `configureServer` API adapter. Therefore a preview fallback does not prove a missing key. Live deployment API availability, credential acceptance, and network behavior remain deployment gates. No secret value is recorded here.
- Reduced-motion limitation remains P3 coverage only: CUA exposes viewport control but no media-feature emulation switch. The Motion provider, CSS override, and executable contract remain in place; a root-session visual recheck must ensure no content depends on animation.

## Primary interaction checklist for final root pass

- Open/close mobile menu; confirm socials stay inside one panel and remain keyboard reachable.
- Activate `Check next month`; confirm month label advances and a new request occurs.
- Inspect safe Cal ID `View all available times` without exposing or inventing a destination.
- Exercise API error retry and confirm full replacement panel remains composed.
- Expand FAQ; use Tab to verify visible focus; check 404 recovery links.
- Inspect header and footer social icons/labels; check browser console after home, booking, empty, error, 404, and interaction states.
- Verify no horizontal overflow or nested page scroll at 1440 desktop, 412 mobile, and 390 narrow mobile.

## Implementation checklist

- [x] Correct hero secondary action treatment.
- [x] Remove nested mobile social navigation surface.
- [x] Apply display typography to 404 heading.
- [x] Stagger portrait then full caption with reduced-motion-safe Motion primitives.
- [x] Add empty-month next-month and full-availability buttons with tested fetch behavior.
- [x] Correct decoded-dimension/DPR claims and invalidate mismatched comparison 1.
- [x] Correct Cal ID preview-adapter explanation without exposing secrets.
- [ ] Root session: capture all post-fix implementation states in the in-app browser.
- [ ] Root session: build and open all five normalized source/implementation boards.
- [ ] Root session: add/open footer evidence and complete interaction/console checks.
- [ ] Root session: record post-fix findings; change the final result only if no P0/P1/P2 remains.

final result: blocked
