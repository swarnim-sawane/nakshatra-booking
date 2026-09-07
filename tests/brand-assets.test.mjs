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
