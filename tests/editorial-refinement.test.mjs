import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("uses Motion with user reduced-motion preferences", () => {
  const main = readFileSync("src/main.tsx", "utf8");
  const reveal = readFileSync("src/components/Reveal.tsx", "utf8");
  assert.match(main, /MotionConfig[^>]*reducedMotion="user"/);
  assert.match(reveal, /whileInView/);
  assert.match(reveal, /viewport=\{\{[^}]*once:\s*true/);
});

test("keeps compact editorial headings and two mobile hero facts", () => {
  const css = readFileSync("src/styles/landing.css", "utf8");
  assert.match(css, /\.landing-section h2\s*\{[^}]*font-size:\s*clamp\(1\.95rem,\s*2\.85vw,\s*2\.9rem\)/s);
  assert.match(css, /@media \(max-width:\s*640px\)[\s\S]*?\.landing-hero__facts\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
});

test("keeps prominent actions and display headings in the editorial system", () => {
  const hero = readFileSync("src/components/Hero.tsx", "utf8");
  const globalCss = readFileSync("src/styles/global.css", "utf8");

  assert.match(hero, /className="button button--secondary landing-hero__secondary-action"/);
  assert.doesNotMatch(hero, /landing-hero__text-link/);
  assert.match(globalCss, /\.not-found__panel h1\s*\{[^}]*font-family:\s*var\(--font-display\)[^}]*font-weight:\s*500/s);
});

test("reveals Nilima's portrait before its semantic caption", () => {
  const component = readFileSync("src/components/MeetNilima.tsx", "utf8");

  assert.match(component, /<figure className="meet-nilima__portrait">/);
  assert.match(component, /<motion\.img[\s\S]*?<motion\.figcaption/);
  assert.match(component, /<motion\.figcaption[\s\S]*?delay:\s*0\.14/);
});

test("keeps the Nakshatra mark upright while loaders animate", () => {
  const availabilityCss = readFileSync("src/styles/availability-calendar.css", "utf8");
  const bookingModalCss = readFileSync("src/styles/booking-modal.css", "utf8");
  const availabilityAnimation = availabilityCss.slice(
    availabilityCss.indexOf("@keyframes availability-logo-load"),
    availabilityCss.indexOf("@media", availabilityCss.indexOf("@keyframes availability-logo-load")),
  );
  const bookingAnimation = bookingModalCss.slice(
    bookingModalCss.indexOf("@keyframes booking-logo-pulse"),
    bookingModalCss.indexOf("@media", bookingModalCss.indexOf("@keyframes booking-logo-pulse")),
  );

  assert.doesNotMatch(availabilityAnimation, /rotate\(/);
  assert.doesNotMatch(bookingAnimation, /rotate\(/);
});
