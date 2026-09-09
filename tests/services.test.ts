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
        durationMinutes: 60,
        priceInr: 1_000,
      },
      {
        slug: "relationship-consultation",
        name: "Relationship Consultation",
        durationMinutes: 60,
        priceInr: 1_000,
      },
      {
        slug: "best-date-analysis",
        name: "Best Date Analysis",
        durationMinutes: 30,
        priceInr: 500,
      },
    ]);
  });

  it("keeps the approved purpose with each reading without obsolete duplicate copy fields", () => {
    expect(consultationServices).toMatchObject([
      {
        slug: "personal-consultation",
        purpose:
          "A private reading of your Kundli for a personal question, important decision or phase of life.",
      },
      {
        slug: "relationship-consultation",
        purpose:
          "A thoughtful reading of two Kundlis to understand needs, recurring patterns and where the relationship feels easy or strained.",
      },
      {
        slug: "best-date-analysis",
        purpose:
          "A Kundli-based review of suitable dates for a marriage, business launch, contract or important move.",
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
