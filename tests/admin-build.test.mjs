import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("admin manifest and worker stay inside the admin boundary", () => {
  const manifest = JSON.parse(
    readFileSync("public/admin/manifest.webmanifest", "utf8"),
  );
  const worker = readFileSync("public/admin/sw.js", "utf8");
  const vite = readFileSync("vite.config.cjs", "utf8");

  assert.equal(manifest.name, "Nakshatra Admin");
  assert.equal(manifest.start_url, "/admin/");
  assert.equal(manifest.scope, "/admin/");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(
    manifest.icons.map(({ src, sizes }) => ({ src, sizes })),
    [
      { src: "/brand/icon-192.png", sizes: "192x192" },
      { src: "/brand/icon-512.png", sizes: "512x512" },
    ],
  );
  assert.match(worker, /pathname\.startsWith\("\/admin\/"\)/);
  assert.match(worker, /openWindow\("\/admin\/"\)/);
  assert.match(worker, /addEventListener\("push"/);
  assert.match(worker, /Open Nakshatra Admin for details\./);
  assert.doesNotMatch(worker, /customerFirstName|email|phone|meetingUrl/);
  assert.match(vite, /admin:\s*resolve\(srcRoot, "admin\/index\.html"\)/);
});

test("admin HTML identifies the private app and loads only its own entry", () => {
  const html = readFileSync("src/admin/index.html", "utf8");

  assert.match(html, /href="\/admin\/manifest\.webmanifest"/);
  assert.match(html, /src="\/admin\/main\.tsx"/);
  assert.match(html, /content="#29483b"/);
  assert.doesNotMatch(html, /prototype|sample/i);
  assert.equal(html.includes('src="/main.tsx"'), false);
});

test("the production build emits the independent admin page and browser assets", () => {
  if (!existsSync("dist/admin/index.html")) return;

  assert.equal(existsSync("dist/admin/manifest.webmanifest"), true);
  assert.equal(existsSync("dist/admin/sw.js"), true);
  assert.equal(existsSync("dist/index.html"), true);
  assert.equal(existsSync("dist/book/index.html"), true);
});
