import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("keeps the approved desktop hero density within the first fold", () => {
  const css = readFileSync("src/styles/landing.css", "utf8");
  const calendarCss = readFileSync("src/styles/availability-calendar.css", "utf8");
  const hero = readFileSync("src/components/Hero.tsx", "utf8");

  assert.match(
    css,
    /\.landing-hero\s*\{[^}]*padding-block:\s*clamp\(18px,\s*2vw,\s*26px\);/s,
  );
  assert.match(
    css,
    /\.landing-hero__grid\s*\{[^}]*grid-template-columns:\s*minmax\(340px,\s*0\.8fr\)\s+minmax\(600px,\s*1\.2fr\);/s,
  );
  assert.match(
    css,
    /\.landing-hero::before\s*\{[^}]*url\("\/images\/consultation-desk\.webp"\)/s,
  );
  assert.doesNotMatch(
    css,
    /\.landing-hero::after\s*\{/s,
    "the hero must not add a Kundli decoration over the photograph",
  );
  assert.match(
    css,
    /rgb\(247 243 234 \/ 68%\) 72%/s,
    "the desktop wash should reveal more of the consultation photograph",
  );
  assert.doesNotMatch(css, /\.landing-hero__image\s*\{/s);
  assert.doesNotMatch(hero, /<img\b/);
  assert.doesNotMatch(css, /\.landing-hero__booking\s*\{[^}]*padding:/s);
  assert.match(
    css,
    /\.landing-hero__facts\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.match(
    calendarCss,
    /\.availability-calendar__body\s*\{[^}]*min-height:\s*20rem;/s,
  );
  assert.match(
    calendarCss,
    /\.availability-calendar__time-list\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.match(
    css,
    /\.meet-nilima__portrait img\s*\{[^}]*height:\s*clamp\(440px,\s*44vw,\s*590px\);/s,
    "the desktop portrait should stay restrained beside Nilima's credibility copy",
  );
  assert.match(
    css,
    /@media \(max-width:\s*640px\)[\s\S]*?\.meet-nilima__portrait img\s*\{[^}]*height:\s*clamp\(300px,\s*82vw,\s*400px\);/s,
    "the mobile portrait must not consume a full screen before the introduction",
  );
  assert.ok(
    hero.indexOf('className="landing-hero__booking"') <
      hero.indexOf('className="landing-hero__supporting"'),
    "the live calendar should precede supporting facts and imagery for the mobile reading order",
  );
});

test("keeps the full approved booking action usable in the narrow header", () => {
  const css = readFileSync("src/styles/global.css", "utf8");
  const header = readFileSync("src/components/Header.tsx", "utf8");

  assert.match(
    header,
    /<BookingAction class="header-booking-action header-booking-action--mobile"\s*\/>/,
    "the mobile header should use the full default Book a consultation label",
  );
  assert.match(
    css,
    /@media \(max-width: 480px\)[\s\S]*?\.site-header \.brand\s*\{[^}]*font-size:\s*1\.05rem;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 480px\)[\s\S]*?\.site-header \.brand__wordmark\s*\{[^}]*display:\s*none;/s,
    "the icon-only brand treatment should preserve room for the exact CTA on the narrowest screens",
  );
});
