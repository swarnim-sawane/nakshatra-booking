import { describe, expect, it } from "vitest";
import {
  parseCalIdBookingUrl,
  resolveCalIdBookingUrl,
} from "../src/config/scheduling";

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
