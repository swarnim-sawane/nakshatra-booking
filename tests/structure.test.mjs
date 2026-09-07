import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("active app is Vite/React and the prototype is preserved", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts.build, "vite build");
  assert.equal(pkg.dependencies.react, "18.3.1");
  assert.equal(pkg.dependencies["react-dom"], "18.3.1");
  assert.equal(pkg.devDependencies.vite, "7.3.1");
  assert.equal(pkg.devDependencies.typescript, "5.9.3");
  assert.equal(pkg.devDependencies.vitest, "4.1.2");
  assert.ok(existsSync("src/index.html"));
  assert.ok(existsSync("src/book/index.html"));
  assert.ok(existsSync("src/main.tsx"));
  assert.ok(existsSync("src/App.tsx"));
  assert.ok(existsSync("dist/index.html"));
  assert.ok(existsSync("dist/book/index.html"));
  assert.ok(existsSync("legacy/calcom-prototype/index.html"));
});
