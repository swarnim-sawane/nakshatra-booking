/// <reference types="vite/client" />

export type SchedulingConfig = {
  provider: "cal-id";
  bookingUrl: URL | null;
  defaultTimeZone: "Asia/Kolkata";
  sessionMinutes: 60;
};

export function parseCalIdBookingUrl(value: string): URL | null {
  const rawValue = value.trim();
  if (!rawValue) return null;

  const authority = rawValue.match(/^https:\/\/([^/?#]+)/i)?.[1];
  if (!authority || authority.includes(":")) return null;

  try {
    const url = new URL(rawValue);
    return (
      url.protocol === "https:" &&
      ["cal.id", "app.cal.id"].includes(url.hostname) &&
      url.port === "" &&
      url.username === "" &&
      url.password === ""
    )
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
