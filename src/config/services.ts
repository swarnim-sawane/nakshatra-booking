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
  imageSrc: `/images/${string}`;
}>;

export const consultationServices = [
  {
    slug: "personal-consultation",
    hash: "#personal-consultation",
    name: "Personal Consultation",
    durationMinutes: 60,
    priceInr: 1_000,
    imageSrc: "/images/consultation-desk.webp",
    purpose:
      "A private reading of your Kundli for a personal question, important decision or phase of life.",
  },
  {
    slug: "relationship-consultation",
    hash: "#relationship-consultation",
    name: "Relationship Consultation",
    durationMinutes: 60,
    priceInr: 1_000,
    imageSrc: "/images/relationship-consultation.webp",
    purpose:
      "A thoughtful reading of two Kundlis to understand needs, recurring patterns and where the relationship feels easy or strained.",
  },
  {
    slug: "best-date-analysis",
    hash: "#best-date-analysis",
    name: "Best Date Analysis",
    durationMinutes: 30,
    priceInr: 500,
    imageSrc: "/images/best-date-analysis.webp",
    purpose:
      "A Kundli-based review of suitable dates for a marriage, business launch, contract or important move.",
  },
] as const satisfies readonly ConsultationService[];

const defaultService: ConsultationService = consultationServices[0];

export function getServiceByHash(hash: string): ConsultationService {
  return (
    consultationServices.find((service) => service.hash === hash) ??
    defaultService
  );
}
