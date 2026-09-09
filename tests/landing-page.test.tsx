import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("Nilima-led reading services landing page", () => {
  it("introduces Nilima and presents the three approved readings before booking", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("Your Kundli, studied before we meet.");
    expect(html).toContain("Nilima Sawane");
    expect(html).toContain("Nakshatra");
    expect(html).not.toContain("Celestial Guidance");

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

    expect(html).toContain("About Nilima");
    expect(html).toContain("A private reading of your Kundli for a personal question");
    expect(html).toContain("where the relationship feels easy or strained");
    expect(html).toContain("marriage, business launch, contract or important move");
    expect(html).not.toMatch(/synastry|composite chart/i);
    expect(html).toContain("does not replace medical, legal, financial or mental-health advice");
    expect(html).not.toMatch(/certified astrologer|award-winning|clients served|five-star|5-star|testimonial/i);
  });

  it("puts the real Personal Consultation calendar in the hero", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain('aria-label="Personal Consultation availability"');
    expect(html).toContain('class="availability-calendar"');
    expect(html).toContain("Choose your time");
    expect(html).toContain('href="https://cal.id/nilima-sawane/personal-consultation?duration=60"');
    expect(html).not.toContain("Prepared personally by Nilima");
    expect(html).not.toContain("Private online consultation");
    expect(html).not.toContain("data-cal-event");
    expect(html).not.toMatch(/<iframe\b/i);
    expect(html).not.toMatch(/overflow\s*:\s*(?:scroll|auto)/i);
  });

  it("uses Nilima's approved first-person story and consultation link", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain('src="/images/nilima-sawane.jpg"');
    expect(html).toContain('alt="Nilima Sawane"');
    expect(html).toContain("I study your Kundli before we speak.");
    expect(html).toContain("I have been reading Kundlis for more than eight years.");
    expect(html).toContain("Before every consultation, I prepare the chart myself");
    expect(html).toContain("You can speak with me in Hindi or Marathi");
    expect(html).toContain('class="meet-nilima__name">Nilima Sawane</');
    expect(html).toContain("Kundli astrologer · Hindi and Marathi consultations");
    expect(html).toContain('class="button button--secondary meet-nilima__link"');
    expect(html).not.toContain("Nilima has offered");
  });

  it("keeps a single page heading and the established landing navigation targets", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const sectionId of ["about", "consultation", "experience", "faqs", "privacy", "booking-policies"]) {
      expect(html).toContain(`id="${sectionId}"`);
    }
    expect(html).not.toContain('id="process"');
    expect(html).not.toContain('id="prepare"');
  });

  it("answers mature consultation and booking questions while preserving policy destinations", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("What can a Kundli reading clarify—and what can it not decide for me?");
    expect(html).toContain("Can I discuss a sensitive personal or relationship matter privately?");
    expect(html).toContain("Are traditional remedies or nuskhe guaranteed to work?");
    expect(html).toContain("What should I do if live times do not load on this website?");
    expect(html).not.toContain("Can I speak in Hindi or Marathi?");
    expect(html).not.toContain("How does Nilima approach difficult questions?");
    expect(html).toContain('href="/#privacy"');
    expect(html).toContain('href="/#booking-policies"');
    expect(html).toContain('id="privacy"');
  });

  it("does not repeat duration or the retired generic labels in service cards", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).not.toContain("service-card__duration");
    expect(html.match(/<dd>60 minutes<\/dd>/g)).toHaveLength(2);
    expect(html.match(/<dd>30 minutes<\/dd>/g)).toHaveLength(1);
    expect(html).not.toContain("Choose your reading");
    expect(html).not.toContain("clarity and direction");
    expect(html.match(/service-card__action/g)).toHaveLength(3);
  });

  it("uses the footer for identity and practical trust links instead of another booking button", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("Personal Kundli consultations with Nilima Sawane · Hindi and Marathi · Online");
    expect(html).toContain('href="/#consultation">Consultations</a>');
    expect(html).toContain('href="/#faqs">FAQs</a>');
    expect(html).not.toContain('class="button button--primary site-footer__booking"');
  });
});
