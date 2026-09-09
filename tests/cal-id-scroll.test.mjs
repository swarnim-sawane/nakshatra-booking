import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the native availability calendar has one page-level scroll context", () => {
  const css = readFileSync("src/styles/availability-calendar.css", "utf8");

  assert.doesNotMatch(css, /overflow:\s*(?:scroll|auto)/);
  assert.doesNotMatch(css, /iframe/);
  assert.match(css, /\.availability-calendar__body\s*\{[^}]*display:\s*grid/s);
});
