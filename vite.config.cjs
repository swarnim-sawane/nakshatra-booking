const { resolve } = require("node:path");

const srcRoot = resolve(__dirname, "src");

module.exports = {
  root: srcRoot,
  envDir: __dirname,
  publicDir: "../public",
  envPrefix: ["VITE_", "PUBLIC_"],
  test: {
    root: __dirname,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    passWithNoTests: true,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        const isLucideDirective =
          warning.code === "MODULE_LEVEL_DIRECTIVE" &&
          /[\\/]node_modules[\\/]lucide-react[\\/]/.test(warning.id ?? "");

        if (!isLucideDirective) {
          defaultHandler(warning);
        }
      },
      input: {
        main: resolve(srcRoot, "index.html"),
        book: resolve(srcRoot, "book/index.html"),
      },
    },
  },
};
