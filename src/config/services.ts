export type ServiceSlug =
  | "personal-consultation"
  | "relationship-consultation"
  | "best-date-analysis";

export type ConsultationService = Readonly<{
  slug: ServiceSlug;
  hash: `#${ServiceSlug}`;
  name: string;
  durationMinutes: 10 | 20 | 30;
  priceInr: 499 | 1_099 | 1_499;
  purpose: string;
  imageSrc: `/images/${string}`;
}>;

export const consultationServices = [
  {
    slug: "personal-consultation",
    hash: "#personal-consultation",
    name: "Personal Consultation",
    durationMinutes: 30,
    priceInr: 1_099,
    imageSrc: "/images/consultation-desk.webp",
    purpose:
      "A full personal consultation for when you don't have one specific question — a detailed look at what your chart shows.",
  },
  {
    slug: "relationship-consultation",
    hash: "#relationship-consultation",
    name: "Relationship Consultation (Kundli Milan)",
    durationMinutes: 20,
    priceInr: 1_499,
    imageSrc: "/images/relationship-consultation.webp",
    purpose:
      "A compatibility reading that looks at where two charts align and where they may need attention.",
  },
  {
    slug: "best-date-analysis",
    hash: "#best-date-analysis",
    name: "Muhurat",
    durationMinutes: 10,
    priceInr: 499,
    imageSrc: "/images/best-date-analysis.webp",
    purpose:
      "Timing for weddings, ceremonies, and other important dates.",
  },
] as const satisfies readonly ConsultationService[];

const defaultService: ConsultationService = consultationServices[0];

export function getServiceByHash(hash: string): ConsultationService {
  return (
    consultationServices.find((service) => service.hash === hash) ??
    defaultService
  );
}
