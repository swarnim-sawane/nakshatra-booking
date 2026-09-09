import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const viteConfig = require("../vite.config.cjs");

test("loads public environment values from the repository root", () => {
  assert.equal(viteConfig.envDir, resolve(process.cwd()));
});

test("keeps Vite's development cache outside the dependency junction", () => {
  assert.equal(viteConfig.cacheDir, resolve(process.cwd(), ".vite-cache"));
});

test("builds a static 404 document", () => {
  assert.match(viteConfig.build.rollupOptions.input.notFound, /src[\\/]404\.html$/);
});

test("deduplicates React for third-party embed packages", () => {
  assert.deepEqual(viteConfig.resolve.dedupe, ["react", "react-dom"]);
});

test("serves the private Cal ID availability proxy during local development", () => {
  const plugin = viteConfig.plugins.find(
    (candidate) => candidate.name === "nakshatra-cal-id-api",
  );

  assert.equal(typeof plugin?.configureServer, "function");
});

test("suppresses only known package module directive warnings", () => {
  const forwarded = [];
  const onwarn = viteConfig.build.rollupOptions.onwarn;
  const forward = (warning) => forwarded.push(warning);

  onwarn(
    {
      code: "MODULE_LEVEL_DIRECTIVE",
      id: "C:/workspace/node_modules/lucide-react/dist/esm/Icon.js",
    },
    forward,
  );
  onwarn(
    {
      code: "MODULE_LEVEL_DIRECTIVE",
      id: "C:/workspace/node_modules/framer-motion/dist/es/motion/index.mjs",
    },
    forward,
  );
  onwarn(
    {
      code: "MODULE_LEVEL_DIRECTIVE",
      id: "C:/workspace/node_modules/another-package/index.js",
    },
    forward,
  );
  onwarn(
    {
      code: "CIRCULAR_DEPENDENCY",
      id: "C:/workspace/node_modules/lucide-react/dist/esm/Icon.js",
    },
    forward,
  );

  assert.deepEqual(forwarded, [
    {
      code: "MODULE_LEVEL_DIRECTIVE",
      id: "C:/workspace/node_modules/another-package/index.js",
    },
    {
      code: "CIRCULAR_DEPENDENCY",
      id: "C:/workspace/node_modules/lucide-react/dist/esm/Icon.js",
    },
  ]);
});
