import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Vercel headers preserve the narrow Cal ID embedding boundary", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));

  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");

  const frameSource = headers["Content-Security-Policy"]
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith("frame-src "));

  assert.equal(frameSource, "frame-src https://cal.id https://app.cal.id");
});
