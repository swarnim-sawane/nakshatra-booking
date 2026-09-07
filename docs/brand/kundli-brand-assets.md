# Kundli brand asset record

Date: 8 September 2026

## Source direction

The visual reference was the user-supplied photograph of a hand-drawn Kundli on warm paper. It was used only for the chart geometry and quiet material restraint. The mark is an original brand asset and does not reproduce the photographed sheet.

The first generated master established the shape. Small-size inspection found its hairline strokes too faint in the website header, so a bolder refinement was generated. The generator rendered a visible checkerboard instead of a true alpha channel on the refinement; a deterministic export step removed only that light checkerboard, normalized the ink and ochre colours, restored RGBA transparency, centred the mark, and produced the required sizes. No geometry was drawn in code.

## Exact final refinement prompt

```text
Edit this logo master into a bolder small-size Kundli brand mark. Preserve the exact transparent background from the source file—output RGBA with a real alpha channel. Do NOT paint or show a transparency checkerboard, white background, cream background, or any visible canvas texture.

Keep the existing square Kundli and curved internal diamond geometry. Make the dark ink strokes about three times thicker and uniformly near-black #1C1915, regularize the intersections, remove all four outer gold dots, and retain at most one tiny flat ochre #A97835 center dot. Let the symbol occupy about 82% of the square canvas with transparent safe padding.

The result must remain unmistakably clean and readable at 28–32 px. No mockup, no paper, no shadow, no text, no zodiac symbols, no stars, no moons, no gradients, no purple, no watermark. Return only one centered raster mark on actual transparency.
```

## Delivered files

| Asset | Dimensions | Intended use |
| --- | ---: | --- |
| `public/brand/kundli-mark-master.png` | 1254 × 1254 | Source master |
| `public/brand/cal-id-logo-600x400.png` | 600 × 400 | Cal ID logo upload |
| `public/brand/favicon-32.png` | 32 × 32 | Browser favicon and website header |
| `public/brand/apple-touch-icon-180.png` | 180 × 180 | Apple touch icon |
| `public/brand/icon-192.png` | 192 × 192 | Compact app icon |
| `public/brand/icon-512.png` | 512 × 512 | Cal ID favicon candidate and large app icon |

All delivered files are RGBA PNGs. `tests/brand-assets.test.mjs` verifies the PNG signature, dimensions, alpha-channel colour type, and the Cal ID favicon size limit.
