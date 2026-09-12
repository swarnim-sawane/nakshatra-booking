/// <reference types="vite/client" />

import type { ConsultationService, ServiceSlug } from "./services";

export type SchedulingConfig = {
  provider: "cal-id";
  bookingUrl: URL | null;
  defaultTimeZone: "Asia/Kolkata";
};

export const DEFAULT_CAL_ID_BOOKING_URL = "https://cal.id/nakshatra-astrology";

export const DEFAULT_CAL_ID_EVENT_URLS = {
  "personal-consultation":
    "https://cal.id/nakshatra-astrology/personal-consultation?duration=30",
  "relationship-consultation":
    "https://cal.id/nakshatra-astrology/relationship-consultation?duration=20",
  "best-date-analysis":
    "https://cal.id/nakshatra-astrology/best-date-analysis?duration=10",
} as const satisfies Record<ServiceSlug, string>;

type CalIdEventEnvironmentKey =
  | "PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL"
  | "PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL"
  | "PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL";

export type CalIdServiceEnvironment = Partial<
  Record<CalIdEventEnvironmentKey | "PUBLIC_CAL_ID_BOOKING_URL", string>
>;

const calIdEventEnvironmentKeys = {
  "personal-consultation": "PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL",
  "relationship-consultation": "PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL",
  "best-date-analysis": "PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL",
} as const satisfies Record<ServiceSlug, CalIdEventEnvironmentKey>;

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

export function getCalIdEventPath(value: URL | string): string | null {
  const url = parseCalIdBookingUrl(
    typeof value === "string" ? value : value.href,
  );
  if (!url) return null;

  const eventPath = url.pathname.replace(/^\/+|\/+$/g, "");
  return eventPath || null;
}

export function buildCalIdCheckoutUrl(
  bookingUrl: URL | string,
  slotStart: string,
): URL | null {
  const safeBookingUrl = parseCalIdBookingUrl(
    typeof bookingUrl === "string" ? bookingUrl : bookingUrl.href,
  );
  const slotDate = new Date(slotStart);

  if (!safeBookingUrl || Number.isNaN(slotDate.getTime())) return null;

  const checkoutUrl = new URL(
    safeBookingUrl.pathname,
    `${safeBookingUrl.protocol}//${safeBookingUrl.host}`,
  );
  const duration = safeBookingUrl.searchParams.get("duration");

  if (duration && /^\d{1,4}$/.test(duration)) {
    checkoutUrl.searchParams.set("duration", duration);
  }
  checkoutUrl.searchParams.set("slot", slotDate.toISOString());

  return checkoutUrl;
}

export function resolveCalIdBookingUrl(value: string | undefined): URL | null {
  const configuredValue = value?.trim();
  return parseCalIdBookingUrl(configuredValue || DEFAULT_CAL_ID_BOOKING_URL);
}

export function getCalIdUrlForService(
  service: ConsultationService,
  env: CalIdServiceEnvironment,
): URL | null {
  const eventUrl = env[calIdEventEnvironmentKeys[service.slug]]?.trim();

  if (eventUrl) return parseCalIdBookingUrl(eventUrl);

  return parseCalIdBookingUrl(DEFAULT_CAL_ID_EVENT_URLS[service.slug]);
}

export const schedulingConfig: SchedulingConfig = {
  provider: "cal-id",
  bookingUrl: resolveCalIdBookingUrl(import.meta.env.PUBLIC_CAL_ID_BOOKING_URL),
  defaultTimeZone: "Asia/Kolkata",
};
