import { describe, expect, it } from "vitest";
import {
  getCalIdUrlForService,
  parseCalIdBookingUrl,
  resolveCalIdBookingUrl,
} from "../src/config/scheduling";
import { consultationServices } from "../src/config/services";

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

  it("uses the validated public profile when an event-specific URL is absent", () => {
    expect(getCalIdUrlForService(personal, {})?.href).toBe(
      "https://cal.id/nilima-sawane",
    );
    expect(
      getCalIdUrlForService(relationship, {
        PUBLIC_CAL_ID_BOOKING_URL: "https://cal.id/nilima-sawane",
      })?.href,
    ).toBe("https://cal.id/nilima-sawane");
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
