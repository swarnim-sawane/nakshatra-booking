import { createAdminSessionHandler } from "../../src/server/adminSessionApi.js";

declare const process: { env: Record<string, string | undefined> };

export function createSessionFetchHandler(environment = process.env) {
  return createAdminSessionHandler({ environment });
}

export default { fetch: createSessionFetchHandler() };
