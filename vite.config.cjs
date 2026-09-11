const { resolve } = require("node:path");

const srcRoot = resolve(__dirname, "src");

function calIdApiDevPlugin() {
  return {
    name: "nakshatra-cal-id-api",
    configureServer(server) {
      server.middlewares.use("/api/cal-id-slots", async (request, response) => {
        try {
          const [{ loadEnv }, availabilityModule] = await Promise.all([
            import("vite"),
            server.ssrLoadModule("/server/calIdAvailability.ts"),
          ]);
          const env = loadEnv(server.config.mode, server.config.envDir, "");
          const result = await availabilityModule.handleCalIdAvailabilityRequest({
            method: request.method ?? "GET",
            url: request.url ?? "/",
            apiKey: process.env.CALID_API_KEY ?? env.CALID_API_KEY,
          });

          response.statusCode = result.status;
          Object.entries(result.headers).forEach(([name, value]) => {
            response.setHeader(name, value);
          });
          response.end(JSON.stringify(result.body));

          if (result.status >= 400) {
            server.config.logger.info(`[cal-id-api] availability returned ${result.status}`);
          }
        } catch (error) {
          server.config.logger.error(
            `[cal-id-api] unexpected local proxy error: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          );
          response.statusCode = 500;
          response.setHeader("Cache-Control", "no-store");
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: "Live availability is temporarily unavailable." }));
        }
      });
    },
  };
}

module.exports = {
  root: srcRoot,
  envDir: __dirname,
  cacheDir: resolve(__dirname, ".vite-cache"),
  publicDir: "../public",
  envPrefix: ["VITE_", "PUBLIC_"],
  plugins: [calIdApiDevPlugin()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
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
        const isKnownPackageDirective =
          warning.code === "MODULE_LEVEL_DIRECTIVE" &&
          /[\\/]node_modules[\\/](?:lucide-react|framer-motion)[\\/]/.test(
            warning.id ?? "",
          );

        if (!isKnownPackageDirective) {
          defaultHandler(warning);
        }
      },
      input: {
        main: resolve(srcRoot, "index.html"),
        book: resolve(srcRoot, "book/index.html"),
        bookingConfirmation: resolve(srcRoot, "booking-confirmed/index.html"),
        notFound: resolve(srcRoot, "404.html"),
      },
    },
  },
};
