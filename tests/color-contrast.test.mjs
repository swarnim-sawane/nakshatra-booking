import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const landingCss = readFileSync("src/styles/landing.css", "utf8");
const bookingCss = readFileSync("src/styles/booking.css", "utf8");
const globalCss = readFileSync("src/styles/global.css", "utf8");
const calendarCss = readFileSync("src/styles/availability-calendar.css", "utf8");

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

function hueAndLightness(hex) {
  const [red, green, blue] = hex
    .slice(1)
    .match(/.{2}/g)
    .map((pair) => Number.parseInt(pair, 16) / 255);
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;

  if (delta !== 0) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    if (maximum === green) hue = 60 * (((blue - red) / delta) + 2);
    if (maximum === blue) hue = 60 * (((red - green) / delta) + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    lightness: (maximum + minimum) / 2,
  };
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
    /\.booking-page__eyebrow,\s*\.booking-handoff__eyebrow\s*\{[^}]*color:\s*var\(--color-ochre-text\);/s,
  );
});

test("Meet Nilima labels meet WCAG AA on the restrained light section", () => {
  const textOchre = readHexToken("--color-ochre-text");
  const surfaceMuted = readHexToken("--color-surface-muted");

  assert.ok(contrastRatio(textOchre, surfaceMuted) >= 4.5);
  assert.match(
    landingCss,
    /\.meet-nilima\s*\{[^}]*background:\s*var\(--color-surface-muted\);/s,
  );
  assert.doesNotMatch(landingCss, /\.meet-nilima \.eyebrow\s*\{/s);
});

test("interaction accents use an accessible lavender and plum palette without legacy green", () => {
  const accent = readHexToken("--color-accent");
  const accentSoft = readHexToken("--color-accent-soft");
  const paper = readHexToken("--color-paper");
  const surface = readHexToken("--color-surface");
  const ink = readHexToken("--color-ink");
  const accentTone = hueAndLightness(accent);
  const softTone = hueAndLightness(accentSoft);
  const appStyles = [tokens, globalCss, landingCss, bookingCss, calendarCss].join("\n");

  assert.ok(accentTone.hue >= 270 && accentTone.hue <= 310);
  assert.ok(softTone.hue >= 270 && softTone.hue <= 310);
  assert.ok(softTone.lightness >= 0.8);
  assert.ok(contrastRatio(accent, paper) >= 4.5);
  assert.ok(contrastRatio(accent, surface) >= 4.5);
  assert.ok(contrastRatio(ink, accentSoft) >= 7);
  assert.match(appStyles, /var\(--color-accent\)/);
  assert.match(appStyles, /var\(--color-accent-soft\)/);
  assert.doesNotMatch(
    appStyles,
    /--color-forest|#2f5d50|#285d50|#9bafa8|#e2e8e2|rgb\(47 93 80|rgba\(36,\s*77,\s*64/i,
  );
});
