import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const brandDirectory = path.resolve("public", "brand");

const expectedAssets = [
  ["kundli-mark-master.png", 1254, 1254],
  ["cal-id-logo-600x400.png", 600, 400],
  ["favicon-32.png", 32, 32],
  ["apple-touch-icon-180.png", 180, 180],
  ["icon-192.png", 192, 192],
  ["icon-512.png", 512, 512],
  ["nakshatra-horizontal-dark.png", 1600, 400],
  ["nakshatra-horizontal-reversed.png", 1600, 400],
  ["nakshatra-horizontal-monochrome.png", 1600, 400],
];

function inspectPng(buffer) {
  assert.deepEqual(buffer.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colourType: buffer[25],
  };
}

test("Kundli brand pack contains correctly sized transparent PNG assets", async () => {
  for (const [fileName, expectedWidth, expectedHeight] of expectedAssets) {
    const buffer = await readFile(path.join(brandDirectory, fileName));
    const png = inspectPng(buffer);

    assert.equal(png.width, expectedWidth, `${fileName} width`);
    assert.equal(png.height, expectedHeight, `${fileName} height`);
    assert.ok([4, 6].includes(png.colourType), `${fileName} must contain an alpha channel`);
  }
});

test("Cal ID favicon candidate stays below the one megabyte upload limit", async () => {
  const icon = await readFile(path.join(brandDirectory, "icon-512.png"));
  assert.ok(icon.byteLength < 1_000_000);
});

test("the supplied Nilima portrait is included as a real JPEG asset", async () => {
  const portrait = await readFile(path.resolve("public", "images", "nilima-sawane.jpg"));

  assert.deepEqual(portrait.subarray(0, 3), Buffer.from([0xff, 0xd8, 0xff]));
  assert.ok(portrait.byteLength > 500_000);
});

test("each specialist reading has an optimized WebP photograph", async () => {
  for (const fileName of ["relationship-consultation.webp", "best-date-analysis.webp"]) {
    const image = await readFile(path.resolve("public", "images", fileName));

    assert.equal(image.subarray(0, 4).toString("ascii"), "RIFF", `${fileName} RIFF header`);
    assert.equal(image.subarray(8, 12).toString("ascii"), "WEBP", `${fileName} WebP header`);
    assert.ok(image.byteLength > 75_000, `${fileName} must retain photographic detail`);
    assert.ok(image.byteLength < 500_000, `${fileName} must stay web optimized`);
  }
});
