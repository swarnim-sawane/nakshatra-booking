import {
  authenticateAdminRequest,
  type AdminAuthEnvironment,
} from "./adminAuth";
import { jsonResponse } from "./adminHttp";
import type { SupabaseAdminStore } from "./supabaseAdminStore";

type AdminBookingsHandlerOptions = {
  environment: AdminAuthEnvironment;
  store: SupabaseAdminStore | null;
  now?: () => Date;
};

export function createAdminBookingsHandler({
  environment,
  store,
  now = () => new Date(),
}: AdminBookingsHandlerOptions) {
  return async function handleAdminBookings(request: Request) {
    if (request.method !== "GET") {
      return jsonResponse(405, { error: "Method not allowed." }, { Allow: "GET" });
    }
    const auth = await authenticateAdminRequest(request, environment, now());
    if (auth === "unconfigured") {
      return jsonResponse(503, { error: "Admin sign-in is not configured." });
    }
    if (auth !== "authenticated") {
      return jsonResponse(401, { error: "Your admin session has expired." });
    }
    if (!store) {
      return jsonResponse(503, { error: "Booking storage is not configured." });
    }

    try {
      return jsonResponse(200, { bookings: await store.listBookings() });
    } catch {
      return jsonResponse(503, { error: "Appointments are temporarily unavailable." });
    }
  };
}
