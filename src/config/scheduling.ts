/// <reference types="vite/client" />

export type SchedulingConfig = {
  provider: "cal-id";
  bookingUrl: URL | null;
  defaultTimeZone: "Asia/Kolkata";
  sessionMinutes: 60;
};

export function parseCalIdBookingUrl(value: string): URL | null {
  if (!value.trim()) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["cal.id", "app.cal.id"].includes(url.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}

export const schedulingConfig: SchedulingConfig = {
  provider: "cal-id",
  bookingUrl: parseCalIdBookingUrl(import.meta.env.PUBLIC_CAL_ID_BOOKING_URL ?? ""),
  defaultTimeZone: "Asia/Kolkata",
  sessionMinutes: 60,
};
