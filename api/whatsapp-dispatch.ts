import { createNeonAdminStore } from "../src/server/neonAdminStore.js";
import { createWhatsAppDispatchHandler } from "../src/server/whatsAppWebhook.js";

declare const process: { env: Record<string, string | undefined> };

export function createWhatsAppDispatchFetchHandler({
  environment = process.env,
  store,
  fetchImpl = fetch,
}: {
  environment?: Record<string, string | undefined>;
  store?: ReturnType<typeof createNeonAdminStore>;
  fetchImpl?: typeof fetch;
} = {}) {
  return createWhatsAppDispatchHandler({
    environment,
    store: store === undefined ? createNeonAdminStore(environment) : store,
    fetchImpl,
  });
}

export default { fetch: createWhatsAppDispatchFetchHandler() };
