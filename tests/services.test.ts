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

  it("keeps the approved purpose, scope, and preparation with each reading", () => {
    expect(consultationServices).toMatchObject([
      {
        slug: "personal-consultation",
        purpose:
          "A one-to-one session for clarity, direction, and a deeper understanding of the client's current life context.",
        scope:
          "Your birth chart: natural tendencies, strengths, recurring patterns, and the themes shaping your experiences. Upcoming transits can also be considered, with a focus on what may unfold over the next year.",
        preparation:
          "One person's birth date, exact birth time when known, birth place, and the main question or situation.",
      },
      {
        slug: "relationship-consultation",
        purpose:
          "A clearer understanding of a relationship without deterministic compatibility scores or soulmate claims.",
        scope:
          "Both birth charts: natural tendencies, emotional needs, and ways of relating. The reading considers synastry—where there may be ease, attraction, tension, or misunderstanding—and the composite chart, which represents the relationship itself.",
        preparation:
          "Both people's birth dates, exact birth times when known, birth places, and one relationship question.",
      },
      {
        slug: "best-date-analysis",
        purpose:
          "Choose supportive timing for an important event such as a marriage, business launch, contract, or major move.",
        scope:
          "Your birth chart and upcoming transits, considered against the event, date range, location, and goals you provide.",
        preparation:
          "The client's birth details, event type, preferred date range, location, and constraints.",
      },
    ]);
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
