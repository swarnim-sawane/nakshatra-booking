import { consultationServices, type ServiceSlug } from "../config/services.js";

const CAL_ID_API_ORIGIN = "https://api.cal.id";
const MAX_RANGE_MILLISECONDS = 42 * 24 * 60 * 60 * 1_000;
const SUCCESS_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";
const ERROR_CACHE_CONTROL = "no-store";
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const UPSTREAM_ATTEMPTS = 2;

type AvailabilityRequest = {
  method: string;
  url: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

export type AvailabilityResponse = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

type CalIdEventType = {
  id?: unknown;
  slug?: unknown;
};

function jsonResponse(status: number, body: unknown, cacheControl = ERROR_CACHE_CONTROL) {
  return {
    status,
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": "application/json; charset=utf-8",
    },
    body,
  } satisfies AvailabilityResponse;
}

function isValidTimeZone(timeZone: string) {
  if (!timeZone || timeZone.length > 64) return false;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

function readEventTypes(payload: unknown): CalIdEventType[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as CalIdEventType[];
  if (!data || typeof data !== "object") return [];

  const eventTypes = (data as { eventTypes?: unknown }).eventTypes;
  if (Array.isArray(eventTypes)) return eventTypes as CalIdEventType[];

  const groups = (data as { eventTypeGroups?: unknown }).eventTypeGroups;
  if (!Array.isArray(groups)) return [];
  return groups.flatMap((group) => {
    if (!group || typeof group !== "object") return [];
    const groupedEventTypes = (group as { eventTypes?: unknown }).eventTypes;
    return Array.isArray(groupedEventTypes)
      ? (groupedEventTypes as CalIdEventType[])
      : [];
  });
}

function normalizeSlots(payload: unknown, start: number, end: number): string[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  const topLevelSlots = (payload as { slots?: unknown }).slots;
  if ((!data || typeof data !== "object") && !topLevelSlots) return [];
  const nestedSlots =
    data && typeof data === "object" ? (data as { slots?: unknown }).slots : undefined;
  const slots = nestedSlots ?? topLevelSlots ?? data;
  if (!slots || typeof slots !== "object" || Array.isArray(slots)) return [];

  const normalized = new Set<string>();
  for (const daySlots of Object.values(slots)) {
    if (!Array.isArray(daySlots)) continue;

    for (const candidate of daySlots) {
      if (!candidate || typeof candidate !== "object") continue;
      const slotCandidate = candidate as { start?: unknown; time?: unknown };
      const time =
        typeof slotCandidate.time === "string"
          ? slotCandidate.time
          : slotCandidate.start;
      if (typeof time !== "string") continue;
      const timestamp = new Date(time).getTime();
      if (!Number.isFinite(timestamp) || timestamp < start || timestamp >= end) continue;
      normalized.add(new Date(timestamp).toISOString());
    }
  }

  return [...normalized].sort();
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchCalIdWithRetry(
  fetchImpl: typeof fetch,
  url: URL,
  headers: Record<string, string>,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < UPSTREAM_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers,
        signal: AbortSignal.timeout(5_000),
      });

      if (
        response.ok ||
        !RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === UPSTREAM_ATTEMPTS - 1
      ) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === UPSTREAM_ATTEMPTS - 1) throw error;
    }
  }

  throw lastError ?? new Error("Cal ID request failed");
}

export async function handleCalIdAvailabilityRequest({
  method,
  url,
  apiKey,
  fetchImpl = fetch,
}: AvailabilityRequest): Promise<AvailabilityResponse> {
  if (method !== "GET") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const requestUrl = new URL(url, "https://nakshatra.local");
  const serviceSlug = requestUrl.searchParams.get("service") as ServiceSlug | null;
  const service = consultationServices.find((candidate) => candidate.slug === serviceSlug);
  const timeZone = requestUrl.searchParams.get("timeZone") ?? "";
  const startValue = requestUrl.searchParams.get("start") ?? "";
  const endValue = requestUrl.searchParams.get("end") ?? "";
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();

  if (
    !service ||
    !isValidTimeZone(timeZone) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    end - start > MAX_RANGE_MILLISECONDS
  ) {
    return jsonResponse(400, { error: "Invalid availability request." });
  }

  if (!apiKey?.trim()) {
    return jsonResponse(503, {
      error: "Live availability is temporarily unavailable.",
    });
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
    "Content-Type": "application/json",
  };

  try {
    const eventTypesUrl = new URL("/event-types/", CAL_ID_API_ORIGIN);
    eventTypesUrl.searchParams.set("page", "1");
    eventTypesUrl.searchParams.set("limit", "1");
    eventTypesUrl.searchParams.set("slug", service.slug);
    const eventTypesResponse = await fetchCalIdWithRetry(fetchImpl, eventTypesUrl, headers);
    const eventTypesPayload = await readJson(eventTypesResponse);
    if (!eventTypesResponse.ok) throw new Error("event-types request failed");

    const eventType = readEventTypes(eventTypesPayload).find(
      (candidate) =>
        candidate.slug === service.slug &&
        typeof candidate.id === "number" &&
        Number.isInteger(candidate.id),
    );
    if (!eventType || typeof eventType.id !== "number") {
      return jsonResponse(502, {
        error: "This consultation is not available for online booking.",
      });
    }

    const slotUrl = new URL("/slots/", CAL_ID_API_ORIGIN);
    slotUrl.searchParams.set("eventTypeId", String(eventType.id));
    slotUrl.searchParams.set("start", new Date(start).toISOString());
    slotUrl.searchParams.set("end", new Date(end).toISOString());
    slotUrl.searchParams.set("timeZone", timeZone);
    slotUrl.searchParams.set("duration", String(service.durationMinutes));

    const slotsResponse = await fetchCalIdWithRetry(fetchImpl, slotUrl, headers);
    const slotsPayload = await readJson(slotsResponse);
    if (!slotsResponse.ok) throw new Error("slots request failed");

    return jsonResponse(
      200,
      {
        service: service.slug,
        timeZone,
        slots: normalizeSlots(slotsPayload, start, end),
      },
      SUCCESS_CACHE_CONTROL,
    );
  } catch {
    return jsonResponse(502, {
      error: "Live availability is temporarily unavailable.",
    });
  }
}
