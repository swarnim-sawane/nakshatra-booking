import { createAdminSessionHandler } from "../../src/server/adminSessionApi.js";
import { createNeonAdminStore } from "../../src/server/neonAdminStore.js";

declare const process: { env: Record<string, string | undefined> };

export function createSessionFetchHandler(environment = process.env) {
  return createAdminSessionHandler({
    environment,
    rateLimiter: createNeonAdminStore(environment),
  });
}

export default { fetch: createSessionFetchHandler() };
