const { resolve } = require("node:path");

const srcRoot = resolve(__dirname, "src");

module.exports = {
  root: srcRoot,
  publicDir: "../public",
  test: {
    root: __dirname,
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(srcRoot, "index.html"),
        book: resolve(srcRoot, "book/index.html"),
      },
    },
  },
};
