import { loadDemoBookings, type AdminBooking } from "./bookings";

export type AdminApiErrorKind = "unauthorized" | "offline" | "unavailable" | "invalid";

export class AdminApiError extends Error {
  constructor(public readonly kind: AdminApiErrorKind, message: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isBooking(value: unknown): value is AdminBooking {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.customerFirstName === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.startsAt === "string" &&
    typeof value.endsAt === "string" &&
    value.timezone === "Asia/Kolkata" &&
    ["confirmed", "paid", "rescheduled", "cancelled", "completed"].includes(
      String(value.status),
    ) &&
    (value.meetingUrl === undefined || typeof value.meetingUrl === "string")
  );
}

async function apiRequest(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(path, { credentials: "same-origin", ...init });
  } catch {
    throw new AdminApiError("offline", "The admin service could not be reached.");
  }
  if (response.status === 401) {
    throw new AdminApiError("unauthorized", "Your admin session has expired.");
  }
  if (!response.ok) {
    throw new AdminApiError("unavailable", "The admin service is temporarily unavailable.");
  }
  return response;
}

export async function loadAdminBookings(): Promise<AdminBooking[]> {
  const response = await apiRequest("/api/admin/bookings");
  const body = (await response.json()) as unknown;
  if (!isRecord(body) || !Array.isArray(body.bookings) || !body.bookings.every(isBooking)) {
    throw new AdminApiError("invalid", "The appointments response was invalid.");
  }
  return body.bookings;
}

export async function loadConfiguredBookings() {
  if (import.meta.env.DEV && import.meta.env.PUBLIC_ADMIN_DEMO_MODE === "true") {
    return loadDemoBookings();
  }
  return loadAdminBookings();
}

export async function signInAdmin(username: string, password: string) {
  let response: Response;
  try {
    response = await fetch("/api/admin/session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new AdminApiError("offline", "The sign-in service could not be reached.");
  }
  if (response.status === 401) {
    throw new AdminApiError("unauthorized", "That sign-in did not work.");
  }
  if (!response.ok) throw new AdminApiError("unavailable", "Sign-in is temporarily unavailable.");
}

export async function signOutAdmin() {
  await apiRequest("/api/admin/session", { method: "DELETE" });
}

export function adminErrorKind(error: unknown): AdminApiErrorKind {
  if (error instanceof AdminApiError) return error.kind;
  return typeof navigator !== "undefined" && navigator.onLine === false
    ? "offline"
    : "unavailable";
}
