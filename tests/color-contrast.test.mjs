import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const landingCss = readFileSync("src/styles/landing.css", "utf8");
const bookingCss = readFileSync("src/styles/booking.css", "utf8");

function readHexToken(name) {
  const match = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `Expected ${name} to be defined as a six-digit hex color`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((pair) => Number.parseInt(pair, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

test("small ochre labels meet WCAG AA on paper and light surfaces", () => {
  const textOchre = readHexToken("--color-ochre-text");
  const paper = readHexToken("--color-paper");
  const surface = readHexToken("--color-surface");

  assert.ok(contrastRatio(textOchre, paper) >= 4.5);
  assert.ok(contrastRatio(textOchre, surface) >= 4.5);
  assert.match(landingCss, /\.eyebrow\s*\{[^}]*color:\s*var\(--color-ochre-text\);/s);
  assert.match(
    bookingCss,
    /\.booking-page__eyebrow,\s*\.booking-embed__eyebrow\s*\{[^}]*color:\s*var\(--color-ochre-text\);/s,
  );
});

test("warm labels meet WCAG AA on the dark about section", () => {
  const textOchreOnDark = readHexToken("--color-ochre-text-on-dark");
  const ink = readHexToken("--color-ink");

  assert.ok(contrastRatio(textOchreOnDark, ink) >= 4.5);
  assert.match(
    landingCss,
    /\.meet-nilima \.eyebrow\s*\{[^}]*color:\s*var\(--color-ochre-text-on-dark\);/s,
  );
});
