import { describe, expect, it } from "vitest";

type AvailabilityHandler = (input: {
  method: string;
  url: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}) => Promise<{
  status: number;
  headers: Record<string, string>;
  body: unknown;
}>;

async function loadHandler(): Promise<AvailabilityHandler | undefined> {
  try {
    const module = await import("../src/server/calIdAvailability");
    return (module as unknown as Record<string, unknown>)
      .handleCalIdAvailabilityRequest as AvailabilityHandler | undefined;
  } catch {
    return undefined;
  }
}

describe("Cal ID availability endpoint", () => {
  it("returns only normalized slots for an allowed consultation service", async () => {
    const handleCalIdAvailabilityRequest = await loadHandler();
    expect(handleCalIdAvailabilityRequest).toBeTypeOf("function");
    if (!handleCalIdAvailabilityRequest) return;

    const requests: Array<{ url: string; authorization: string | null }> = [];
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      requests.push({ url, authorization: headers.get("Authorization") });

      if (url.includes("/event-types/")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: [
              { id: 77, slug: "personal-consultation", title: "Personal Consultation" },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            slots: {
              "2026-09-08": [
                { time: "2026-09-08T10:15:00.000Z" },
                { time: "2026-09-08T09:15:00.000Z" },
              ],
              "2026-09-09": [{ time: "2026-09-09T09:15:00.000Z" }],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const response = await handleCalIdAvailabilityRequest({
      method: "GET",
      url:
        "https://nakshatra.example/api/cal-id-slots?service=personal-consultation&start=2026-09-01T00%3A00%3A00.000Z&end=2026-10-01T00%3A00%3A00.000Z&timeZone=Asia%2FKolkata",
      apiKey: "calid_private_test_key",
      fetchImpl,
    });

    expect(response.status).toBe(200);
    expect(response.headers["Cache-Control"]).toBe(
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    expect(response.body).toEqual({
      service: "personal-consultation",
      timeZone: "Asia/Kolkata",
      slots: [
        "2026-09-08T09:15:00.000Z",
        "2026-09-08T10:15:00.000Z",
        "2026-09-09T09:15:00.000Z",
      ],
    });
    expect(JSON.stringify(response.body)).not.toContain("calid_private_test_key");
    expect(requests).toHaveLength(2);
    expect(requests[0].authorization).toBe("Bearer calid_private_test_key");
    expect(requests[0].url).toContain("slug=personal-consultation");
    expect(requests[0].url).toContain("limit=1");
    expect(requests[1].url).toContain("eventTypeId=77");
    expect(requests[1].url).toContain("duration=30");
  });

  it("rejects unknown services and oversized ranges before contacting Cal ID", async () => {
    const handleCalIdAvailabilityRequest = await loadHandler();
    expect(handleCalIdAvailabilityRequest).toBeTypeOf("function");
    if (!handleCalIdAvailabilityRequest) return;

    let requestCount = 0;
    const fetchImpl = (async () => {
      requestCount += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const unknownService = await handleCalIdAvailabilityRequest({
      method: "GET",
      url:
        "https://nakshatra.example/api/cal-id-slots?service=private-admin&start=2026-09-01T00%3A00%3A00.000Z&end=2026-10-01T00%3A00%3A00.000Z&timeZone=Asia%2FKolkata",
      apiKey: "calid_private_test_key",
      fetchImpl,
    });
    const oversizedRange = await handleCalIdAvailabilityRequest({
      method: "GET",
      url:
        "https://nakshatra.example/api/cal-id-slots?service=personal-consultation&start=2026-09-01T00%3A00%3A00.000Z&end=2026-12-01T00%3A00%3A00.000Z&timeZone=Asia%2FKolkata",
      apiKey: "calid_private_test_key",
      fetchImpl,
    });

    expect(unknownService.status).toBe(400);
    expect(oversizedRange.status).toBe(400);
    expect(requestCount).toBe(0);
  });

  it("accepts Cal ID event-group and date-map response variants", async () => {
    const handleCalIdAvailabilityRequest = await loadHandler();
    expect(handleCalIdAvailabilityRequest).toBeTypeOf("function");
    if (!handleCalIdAvailabilityRequest) return;

    const fetchImpl = (async (input: string | URL | Request) => {
      if (String(input).includes("/event-types/")) {
        return new Response(
          JSON.stringify({
            data: {
              eventTypeGroups: [
                { eventTypes: [{ id: 88, slug: "relationship-consultation" }] },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          data: {
            "2026-09-08": [{ start: "2026-09-08T09:15:00.000Z" }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const response = await handleCalIdAvailabilityRequest({
      method: "GET",
      url:
        "https://nakshatra.example/api/cal-id-slots?service=relationship-consultation&start=2026-09-01T00%3A00%3A00.000Z&end=2026-10-01T00%3A00%3A00.000Z&timeZone=Asia%2FKolkata",
      apiKey: "calid_private_test_key",
      fetchImpl,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: "relationship-consultation",
      timeZone: "Asia/Kolkata",
      slots: ["2026-09-08T09:15:00.000Z"],
    });
  });

  it("retries a transient Cal ID response once inside the server request", async () => {
    const handleCalIdAvailabilityRequest = await loadHandler();
    expect(handleCalIdAvailabilityRequest).toBeTypeOf("function");
    if (!handleCalIdAvailabilityRequest) return;

    let eventTypeAttempts = 0;
    const fetchImpl = (async (input: string | URL | Request) => {
      if (String(input).includes("/event-types/")) {
        eventTypeAttempts += 1;
        if (eventTypeAttempts === 1) {
          return new Response(JSON.stringify({ error: "temporary" }), { status: 503 });
        }
        return new Response(
          JSON.stringify({ data: [{ id: 77, slug: "personal-consultation" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ data: { slots: {} } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const response = await handleCalIdAvailabilityRequest({
      method: "GET",
      url:
        "https://nakshatra.example/api/cal-id-slots?service=personal-consultation&start=2026-09-01T00%3A00%3A00.000Z&end=2026-10-01T00%3A00%3A00.000Z&timeZone=Asia%2FKolkata",
      apiKey: "calid_private_test_key",
      fetchImpl,
    });

    expect(response.status).toBe(200);
    expect(eventTypeAttempts).toBe(2);
  });

  it("fails safely when the server-side API key is missing", async () => {
    const handleCalIdAvailabilityRequest = await loadHandler();
    expect(handleCalIdAvailabilityRequest).toBeTypeOf("function");
    if (!handleCalIdAvailabilityRequest) return;

    const response = await handleCalIdAvailabilityRequest({
      method: "GET",
      url:
        "https://nakshatra.example/api/cal-id-slots?service=personal-consultation&start=2026-09-01T00%3A00%3A00.000Z&end=2026-10-01T00%3A00%3A00.000Z&timeZone=Asia%2FKolkata",
    });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: "Live availability is temporarily unavailable.",
    });
  });
});
