import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAL_ID_EVENT_URLS,
  getCalIdEventPath,
  getCalIdUrlForService,
  parseCalIdBookingUrl,
  resolveCalIdBookingUrl,
} from "../src/config/scheduling";
import { consultationServices } from "../src/config/services";
import * as schedulingModule from "../src/config/scheduling";

describe("parseCalIdBookingUrl", () => {
  it("accepts an HTTPS Cal ID event URL", () => {
    expect(parseCalIdBookingUrl("https://cal.id/example/consultation")?.hostname).toBe("cal.id");
  });
  it("accepts the Cal ID app origin", () => {
    expect(parseCalIdBookingUrl("https://app.cal.id/example/consultation")?.hostname).toBe("app.cal.id");
  });
  it.each([
    "",
    "http://cal.id/example",
    "https://evil.example/book",
    "javascript:alert(1)",
    "https://cal.id:443/example",
    "https://app.cal.id:443/example",
    "https://cal.id:8443/example",
    "https://app.cal.id:444/example",
    "https://user:pass@cal.id/example",
  ])(
    "rejects unsafe value %s",
    (value) => expect(parseCalIdBookingUrl(value)).toBeNull(),
  );
});

describe("getCalIdEventPath", () => {
  it("derives an embed-safe event path and drops query and hash data", () => {
    expect(
      getCalIdEventPath(
        "https://cal.id/nilima-sawane/personal-consultation?duration=30#ignored",
      ),
    ).toBe("nilima-sawane/personal-consultation");
  });

  it("accepts a validated URL object", () => {
    expect(
      getCalIdEventPath(
        new URL("https://app.cal.id/nilima-sawane/relationship-consultation"),
      ),
    ).toBe("nilima-sawane/relationship-consultation");
  });

  it.each([
    "https://evil.example/nilima-sawane/personal-consultation",
    "https://cal.id/",
    "javascript:alert(1)",
  ])("rejects an invalid or incomplete embed destination %s", (value) => {
    expect(getCalIdEventPath(value)).toBeNull();
  });
});

describe("resolveCalIdBookingUrl", () => {
  it("uses Nilima Sawane's public Cal ID page when no deployment override is set", () => {
    expect(resolveCalIdBookingUrl(undefined)?.href).toBe("https://cal.id/nilima-sawane");
    expect(resolveCalIdBookingUrl("  ")?.href).toBe("https://cal.id/nilima-sawane");
  });

  it("keeps a valid event-specific deployment override", () => {
    expect(resolveCalIdBookingUrl("https://cal.id/nilima-sawane/astrology-consultation")?.href).toBe(
      "https://cal.id/nilima-sawane/astrology-consultation",
    );
  });

  it("fails closed for an explicitly unsafe deployment override", () => {
    expect(resolveCalIdBookingUrl("https://example.com/fake-calendar")).toBeNull();
  });
});

describe("getCalIdUrlForService", () => {
  const [personal, relationship, bestDate] = consultationServices;

  it("uses a valid event-specific Cal ID URL for the selected service", () => {
    expect(
      getCalIdUrlForService(personal, {
        PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL:
          "https://cal.id/nilima-sawane/personal-consultation",
      })?.href,
    ).toBe("https://cal.id/nilima-sawane/personal-consultation");

    expect(
      getCalIdUrlForService(relationship, {
        PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL:
          "https://app.cal.id/nilima-sawane/relationship-consultation",
      })?.href,
    ).toBe("https://app.cal.id/nilima-sawane/relationship-consultation");

    expect(
      getCalIdUrlForService(bestDate, {
        PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL:
          "https://cal.id/nilima-sawane/best-date-analysis",
      })?.href,
    ).toBe("https://cal.id/nilima-sawane/best-date-analysis");
  });

  it("uses verified direct-event defaults when deployment overrides are absent", () => {
    expect(getCalIdUrlForService(personal, {})?.href).toBe(
      DEFAULT_CAL_ID_EVENT_URLS["personal-consultation"],
    );
    expect(
      getCalIdUrlForService(relationship, {
        PUBLIC_CAL_ID_BOOKING_URL: "https://cal.id/nilima-sawane",
      })?.href,
    ).toBe(DEFAULT_CAL_ID_EVENT_URLS["relationship-consultation"]);
    expect(getCalIdUrlForService(bestDate, {})?.href).toBe(
      DEFAULT_CAL_ID_EVENT_URLS["best-date-analysis"],
    );
  });

  it.each([
    "http://cal.id/nilima-sawane/personal-consultation",
    "https://evil.example/personal-consultation",
    "https://cal.id:443/nilima-sawane/personal-consultation",
  ])("rejects an explicitly invalid event-specific URL %s", (value) => {
    expect(
      getCalIdUrlForService(personal, {
        PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL: value,
      }),
    ).toBeNull();
  });
});

describe("buildCalIdCheckoutUrl", () => {
  it("creates an exact-slot Cal ID handoff without forwarding unrelated query or hash data", () => {
    const buildCalIdCheckoutUrl = (
      schedulingModule as unknown as Record<string, unknown>
    ).buildCalIdCheckoutUrl;

    expect(buildCalIdCheckoutUrl).toBeTypeOf("function");
    if (typeof buildCalIdCheckoutUrl !== "function") return;

    const result = buildCalIdCheckoutUrl(
      new URL(
        "https://cal.id/nilima-sawane/personal-consultation?duration=30&s=opaque-token#private",
      ),
      "2026-09-08T09:15:00.000Z",
    ) as URL | null;

    expect(result?.href).toBe(
      "https://cal.id/nilima-sawane/personal-consultation?duration=30&slot=2026-09-08T09%3A15%3A00.000Z",
    );
    expect(result?.href).not.toContain("opaque-token");
  });

  it("fails closed for invalid Cal ID URLs and invalid slot timestamps", () => {
    const buildCalIdCheckoutUrl = (
      schedulingModule as unknown as Record<string, unknown>
    ).buildCalIdCheckoutUrl;

    expect(buildCalIdCheckoutUrl).toBeTypeOf("function");
    if (typeof buildCalIdCheckoutUrl !== "function") return;

    expect(
      buildCalIdCheckoutUrl(
        new URL("https://evil.example/personal-consultation"),
        "2026-09-08T09:15:00.000Z",
      ),
    ).toBeNull();
    expect(
      buildCalIdCheckoutUrl(
        new URL("https://cal.id/nilima-sawane/personal-consultation"),
        "not-a-date",
      ),
    ).toBeNull();
  });
});
