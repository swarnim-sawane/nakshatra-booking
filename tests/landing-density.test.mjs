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

test("keeps the requested brand, booking action and menu order in the mobile header", () => {
  const css = readFileSync("src/styles/global.css", "utf8");
  const header = readFileSync("src/components/Header.tsx", "utf8");

  assert.match(
    header,
    /<BookingAction[\s\S]*?label="Book consultation"[\s\S]*?class="header-booking-action header-booking-action--mobile"[\s\S]*?\/>/,
    "the mobile header should use a compact booking label",
  );
  assert.ok(
    header.indexOf('class="header-booking-action header-booking-action--mobile"') <
      header.indexOf('className="mobile-navigation"'),
    "the booking action should sit immediately before the far-right menu",
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[\s\S]*?\.site-header \.brand\s*\{[^}]*position:\s*static;[^}]*font-size:\s*1\.05rem;/s,
    "the full mobile brand should remain naturally aligned at the left",
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[\s\S]*?\.mobile-navigation > nav\s*\{[^}]*right:\s*0;[^}]*left:\s*auto;/s,
    "the menu panel should open inward from the right edge",
  );
});
