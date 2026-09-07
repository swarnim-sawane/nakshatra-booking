import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const viteConfig = require("../vite.config.cjs");

test("loads public environment values from the repository root", () => {
  assert.equal(viteConfig.envDir, resolve(process.cwd()));
});

test("suppresses only lucide-react module directive warnings", () => {
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
