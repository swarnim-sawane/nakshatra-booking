import { describe, expect, it } from "vitest";
import {
  consultationServices,
  getServiceByHash,
} from "../src/config/services";

describe("consultationServices", () => {
  it("publishes the three approved readings with their exact prices and durations", () => {
    expect(
      consultationServices.map(({ slug, name, durationMinutes, priceInr }) => ({
        slug,
        name,
        durationMinutes,
        priceInr,
      })),
    ).toEqual([
      {
        slug: "personal-consultation",
        name: "Personal Consultation",
        durationMinutes: 30,
        priceInr: 1_099,
      },
      {
        slug: "relationship-consultation",
        name: "Relationship Consultation (Kundli Milan)",
        durationMinutes: 20,
        priceInr: 1_499,
      },
      {
        slug: "best-date-analysis",
        name: "Muhurat",
        durationMinutes: 10,
        priceInr: 499,
      },
    ]);
  });

  it("keeps the approved purpose with each reading without obsolete duplicate copy fields", () => {
    expect(consultationServices).toMatchObject([
      {
        slug: "personal-consultation",
        purpose:
          "A full personal consultation for when you don't have one specific question — a detailed look at what your chart shows.",
      },
      {
        slug: "relationship-consultation",
        purpose:
          "A compatibility reading that looks at where two charts align and where they may need attention.",
      },
      {
        slug: "best-date-analysis",
        purpose:
          "Timing for weddings, ceremonies, and other important dates.",
      },
    ]);

    for (const service of consultationServices) {
      expect(service).not.toHaveProperty("scope");
      expect(service).not.toHaveProperty("preparation");
    }
  });
});

describe("getServiceByHash", () => {
  it.each([
    ["#personal-consultation", "personal-consultation"],
    ["#relationship-consultation", "relationship-consultation"],
    ["#best-date-analysis", "best-date-analysis"],
  ])("selects %s", (hash, expectedSlug) => {
    expect(getServiceByHash(hash).slug).toBe(expectedSlug);
  });

  it.each([
    "",
    "#unknown-reading",
    "#relationship-consultation?s=opaque-test-token",
    "?s=opaque-test-token#relationship-consultation",
  ])("falls back to Personal Consultation for invalid hash %s", (hash) => {
    expect(getServiceByHash(hash).slug).toBe("personal-consultation");
  });
});
