import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("Nilima-led reading services landing page", () => {
  it("introduces Nilima and presents the three approved readings before booking", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("Your birth chart, understood in the context of your life.");
    expect(html).toContain("Nilima Sawane");

    for (const service of [
      { name: "Personal Consultation", duration: "60 minutes", price: "₹1,000", slug: "personal-consultation" },
      {
        name: "Relationship Consultation",
        duration: "60 minutes",
        price: "₹1,000",
        slug: "relationship-consultation",
      },
      { name: "Best Date Analysis", duration: "30 minutes", price: "₹500", slug: "best-date-analysis" },
    ]) {
      expect(html).toContain(service.name);
      expect(html).toContain(service.duration);
      expect(html).toContain(service.price);
      expect(html).toContain(`href="/book/#${service.slug}"`);
    }
  });

  it("uses the approved reading scope and a factual introduction without invented authority claims", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("Meet Nilima");
    expect(html).toContain("natural tendencies, strengths, recurring patterns, and the themes shaping your experiences");
    expect(html).toContain("ease, attraction, tension, or misunderstanding");
    expect(html).toContain("composite chart, which represents the relationship itself");
    expect(html).toContain("marriage, business launch, contract, or major move");
    expect(html).toContain("does not replace medical, legal, financial, or mental-health advice");
    expect(html).not.toMatch(
      /certified astrologer|award-winning|years? of experience|clients served|five-star|5-star|fluent in|testimonial/i,
    );
  });

  it("keeps a single page heading and the established landing navigation targets", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const sectionId of ["about", "consultation", "process", "prepare", "faqs"]) {
      expect(html).toContain(`id="${sectionId}"`);
    }
  });

  it("directs rescheduling questions to the terms shown before confirmation", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("review the terms presented before confirming your booking");
    expect(html).not.toContain("policies still need to be supplied");
  });
});
