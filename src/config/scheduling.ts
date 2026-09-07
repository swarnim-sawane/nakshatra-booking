/// <reference types="vite/client" />

import type { ConsultationService, ServiceSlug } from "./services";

export type SchedulingConfig = {
  provider: "cal-id";
  bookingUrl: URL | null;
  defaultTimeZone: "Asia/Kolkata";
  sessionMinutes: 60;
};

export const DEFAULT_CAL_ID_BOOKING_URL = "https://cal.id/nilima-sawane";

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

  return resolveCalIdBookingUrl(env.PUBLIC_CAL_ID_BOOKING_URL);
}

export const schedulingConfig: SchedulingConfig = {
  provider: "cal-id",
  bookingUrl: resolveCalIdBookingUrl(import.meta.env.PUBLIC_CAL_ID_BOOKING_URL),
  defaultTimeZone: "Asia/Kolkata",
  sessionMinutes: 60,
};
