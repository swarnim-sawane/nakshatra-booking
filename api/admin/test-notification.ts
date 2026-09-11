import { createAdminTestNotificationHandler } from "../../src/server/adminPushApi.js";
import { createNeonAdminStore } from "../../src/server/neonAdminStore.js";
import { readVapidConfig } from "../../src/server/webPush.js";

declare const process: { env: Record<string, string | undefined> };

export function createTestNotificationFetchHandler(
  environment = process.env,
  fetchImpl: typeof fetch = fetch,
) {
  return createAdminTestNotificationHandler({
    environment,
    store: createNeonAdminStore(environment),
    vapid: readVapidConfig(environment),
    fetchImpl,
  });
}

export default { fetch: createTestNotificationFetchHandler() };
