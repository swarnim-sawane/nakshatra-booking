import { createAdminTestNotificationHandler } from "../../src/server/adminPushApi.js";
import { createSupabaseAdminStore } from "../../src/server/supabaseAdminStore.js";
import { readVapidConfig } from "../../src/server/webPush.js";

declare const process: { env: Record<string, string | undefined> };

export function createTestNotificationFetchHandler(
  environment = process.env,
  fetchImpl: typeof fetch = fetch,
) {
  return createAdminTestNotificationHandler({
    environment,
    store: createSupabaseAdminStore(environment, fetchImpl),
    vapid: readVapidConfig(environment),
    fetchImpl,
  });
}

export default { fetch: createTestNotificationFetchHandler() };
