import {
  authenticateAdminRequest,
  isSameOriginMutation,
  type AdminAuthEnvironment,
} from "./adminAuth";
import { isRecord, jsonResponse, readLimitedJson } from "./adminHttp";
import type { AdminDataStore } from "./neonAdminStore";

type AdminBookingsHandlerOptions = {
  environment: AdminAuthEnvironment;
  store: AdminDataStore | null;
  now?: () => Date;
};

export function createAdminBookingsHandler({
  environment,
  store,
  now = () => new Date(),
}: AdminBookingsHandlerOptions) {
  return async function handleAdminBookings(request: Request) {
    if (request.method !== "GET" && request.method !== "DELETE") {
      return jsonResponse(405, { error: "Method not allowed." }, { Allow: "GET, DELETE" });
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

    if (request.method === "GET") {
      try {
        return jsonResponse(200, { bookings: await store.listBookings() });
      } catch {
        return jsonResponse(503, { error: "Appointments are temporarily unavailable." });
      }
    }

    if (!isSameOriginMutation(request)) {
      return jsonResponse(403, { error: "Request origin is not allowed." });
    }
    let body: unknown;
    try {
      body = await readLimitedJson(request);
    } catch {
      return jsonResponse(400, { error: "Invalid removal request." });
    }
    const bookingUid = isRecord(body) && typeof body.bookingUid === "string"
      ? body.bookingUid.trim()
      : "";
    if (!/^[A-Za-z0-9_-]{1,200}$/.test(bookingUid)) {
      return jsonResponse(400, { error: "Invalid removal request." });
    }

    try {
      const result = await store.deleteBooking(bookingUid);
      if (result === "active") {
        return jsonResponse(409, {
          error: "Active future appointments cannot be removed.",
        });
      }
      if (result === "not_found") {
        return jsonResponse(404, { error: "Appointment was not found." });
      }
      return jsonResponse(200, { removed: true });
    } catch {
      return jsonResponse(503, { error: "The appointment could not be removed." });
    }
  };
}
