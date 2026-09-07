export type ServiceSlug =
  | "personal-consultation"
  | "relationship-consultation"
  | "best-date-analysis";

export type ConsultationService = Readonly<{
  slug: ServiceSlug;
  hash: `#${ServiceSlug}`;
  name: string;
  durationMinutes: 30 | 60;
  priceInr: 500 | 1_000;
  purpose: string;
  scope: string;
  preparation: string;
}>;

export const consultationServices = [
  {
    slug: "personal-consultation",
    hash: "#personal-consultation",
    name: "Personal Consultation",
    durationMinutes: 60,
    priceInr: 1_000,
    purpose:
      "A one-to-one session for clarity, direction, and a deeper understanding of the client's current life context.",
    scope:
      "Your birth chart: natural tendencies, strengths, recurring patterns, and the themes shaping your experiences. Upcoming transits can also be considered, with a focus on what may unfold over the next year.",
    preparation:
      "One person's birth date, exact birth time when known, birth place, and the main question or situation.",
  },
  {
    slug: "relationship-consultation",
    hash: "#relationship-consultation",
    name: "Relationship Consultation",
    durationMinutes: 60,
    priceInr: 1_000,
    purpose:
      "A clearer understanding of a relationship without deterministic compatibility scores or soulmate claims.",
    scope:
      "Both birth charts: natural tendencies, emotional needs, and ways of relating. The reading considers synastry—where there may be ease, attraction, tension, or misunderstanding—and the composite chart, which represents the relationship itself.",
    preparation:
      "Both people's birth dates, exact birth times when known, birth places, and one relationship question.",
  },
  {
    slug: "best-date-analysis",
    hash: "#best-date-analysis",
    name: "Best Date Analysis",
    durationMinutes: 30,
    priceInr: 500,
    purpose:
      "Choose supportive timing for an important event such as a marriage, business launch, contract, or major move.",
    scope:
      "Your birth chart and upcoming transits, considered against the event, date range, location, and goals you provide.",
    preparation:
      "The client's birth details, event type, preferred date range, location, and constraints.",
  },
] as const satisfies readonly ConsultationService[];

const defaultService: ConsultationService = consultationServices[0];

export function getServiceByHash(hash: string): ConsultationService {
  return (
    consultationServices.find((service) => service.hash === hash) ??
    defaultService
  );
}
