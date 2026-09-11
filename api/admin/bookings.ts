import { createAdminBookingsHandler } from "../../src/server/adminBookingsApi.js";
import { createNeonAdminStore } from "../../src/server/neonAdminStore.js";

declare const process: { env: Record<string, string | undefined> };

export function createBookingsFetchHandler(environment = process.env) {
  return createAdminBookingsHandler({
    environment,
    store: createNeonAdminStore(environment),
  });
}

export default { fetch: createBookingsFetchHandler() };
