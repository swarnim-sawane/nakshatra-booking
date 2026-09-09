import { createAdminPushSubscriptionHandler } from "../../src/server/adminPushApi.js";
import { createSupabaseAdminStore } from "../../src/server/supabaseAdminStore.js";
import { readVapidConfig } from "../../src/server/webPush.js";

declare const process: { env: Record<string, string | undefined> };

export function createPushSubscriptionFetchHandler(
  environment = process.env,
  fetchImpl: typeof fetch = fetch,
) {
  return createAdminPushSubscriptionHandler({
    environment,
    store: createSupabaseAdminStore(environment, fetchImpl),
    vapid: readVapidConfig(environment),
  });
}

export default { fetch: createPushSubscriptionFetchHandler() };
