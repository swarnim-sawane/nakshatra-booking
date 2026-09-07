import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("keeps the approved desktop hero density within the first fold", () => {
  const css = readFileSync("src/styles/landing.css", "utf8");

  assert.match(
    css,
    /\.landing-hero\s*\{[^}]*padding-block:\s*var\(--space-12\)\s+var\(--space-16\);/s,
  );
  assert.match(
    css,
    /\.booking-preview__image\s*\{[^}]*height:\s*280px;/s,
  );
  assert.match(
    css,
    /\.booking-preview__body\s*\{[^}]*gap:\s*var\(--space-4\);[^}]*padding:\s*clamp\(24px,\s*2vw,\s*32px\);/s,
  );
});
