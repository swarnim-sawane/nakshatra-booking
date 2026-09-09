import { createAdminBookingsHandler } from "../../src/server/adminBookingsApi.js";
import { createSupabaseAdminStore } from "../../src/server/supabaseAdminStore.js";

declare const process: { env: Record<string, string | undefined> };

export function createBookingsFetchHandler(environment = process.env, fetchImpl: typeof fetch = fetch) {
  return createAdminBookingsHandler({
    environment,
    store: createSupabaseAdminStore(environment, fetchImpl),
  });
}

export default { fetch: createBookingsFetchHandler() };
