import { createAdminPushSubscriptionHandler } from "../../src/server/adminPushApi.js";
import { createNeonAdminStore } from "../../src/server/neonAdminStore.js";
import { readVapidConfig } from "../../src/server/webPush.js";

declare const process: { env: Record<string, string | undefined> };

export function createPushSubscriptionFetchHandler(
  environment = process.env,
) {
  return createAdminPushSubscriptionHandler({
    environment,
    store: createNeonAdminStore(environment),
    vapid: readVapidConfig(environment),
  });
}

export default { fetch: createPushSubscriptionFetchHandler() };
