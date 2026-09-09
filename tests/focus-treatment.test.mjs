import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("final booking action has a two-tone focus treatment on plum", () => {
  const css = readFileSync("src/styles/landing.css", "utf8");
  const rule = css.match(/\.final-booking \.button:focus-visible\s*\{([^}]*)\}/s);

  assert.ok(rule, "Expected a final-booking focus-visible override");
  assert.match(rule[1], /outline:\s*3px solid var\(--color-surface\);/);
  assert.match(rule[1], /outline-offset:\s*3px;/);
  assert.match(rule[1], /box-shadow:\s*0 0 0 3px var\(--color-ink\);/);
});
