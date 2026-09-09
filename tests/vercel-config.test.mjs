import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Vercel headers keep the native booking UI on first-party origins", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));

  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");

  const csp = headers["Content-Security-Policy"];
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
  assert.match(csp, /font-src 'self' https:\/\/fonts\.gstatic\.com/);
  assert.match(csp, /frame-src 'none'/);
  assert.doesNotMatch(csp, /https:\/\/cal\.id|https:\/\/app\.cal\.id/);
  assert.doesNotMatch(csp, /\*/);
});
