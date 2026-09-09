import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("Nilima-led reading services landing page", () => {
  it("introduces Nilima and presents the supplied reading areas before booking", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("Kundli readings by Nilima Sawane");
    expect(html).toContain("marriage, career, family, and the timing of important decisions");
    expect(html).toContain("Nilima Sawane");
    expect(html).toContain("Nakshatra");
    expect(html).not.toContain("Celestial Guidance");

    for (const reading of [
      "Marriage &amp; Compatibility (Kundli Milan)",
      "Career &amp; Life Direction",
      "Health &amp; Family Matters",
      "Muhurat (Auspicious Timing)",
      "General Readings",
    ]) {
      expect(html).toContain(reading);
    }
  });

  it("uses the approved reading scope and a factual introduction without invented authority claims", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("About");
    expect(html).toContain("Nilima Sawane has been reading birth charts for over eight years");
    expect(html).toContain("A compatibility reading that looks at where two charts align");
    expect(html).toContain("Timing for weddings, ceremonies, and other important dates.");
    expect(html).not.toMatch(/certified astrologer|award-winning|clients served|five-star|5-star|testimonial/i);
  });

  it("puts the real Personal Consultation calendar in the hero", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain('aria-label="Personal Consultation availability"');
    expect(html).toContain('class="availability-calendar"');
    expect(html).toContain("Select an available time");
    expect(html).toContain('href="/book/">Other consultations</a>');
    expect(html).not.toContain("Prepared personally by Nilima");
    expect(html).not.toContain("Private online consultation");
    expect(html).not.toContain("data-cal-event");
    expect(html).not.toMatch(/<iframe\b/i);
    expect(html).not.toMatch(/overflow\s*:\s*(?:scroll|auto)/i);
  });

  it("uses the supplied third-person biography and reading link", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain('src="/images/nilima-sawane.jpg"');
    expect(html).toContain('alt="Nilima Sawane"');
    expect(html).toContain("working directly with individuals and families");
    expect(html).toContain("plain, clear language");
    expect(html).toContain('class="meet-nilima__name">Nilima Sawane</');
    expect(html).toContain("Personal Kundli consultations in Hindi and Marathi");
    expect(html).toContain('class="button button--secondary meet-nilima__link"');
    expect(html).not.toContain("Nilima has offered");
  });

  it("keeps a single page heading and the supplied landing navigation targets", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const sectionId of ["about", "consultation", "experience", "approach", "contact"]) {
      expect(html).toContain(`id="${sectionId}"`);
    }
    expect(html).not.toContain('id="process"');
    expect(html).not.toContain('id="prepare"');
  });

  it("shows the consultation steps, approach and a protected booking action", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("Share your birth details");
    expect(html).toContain("Nilima prepares your chart");
    expect(html).toContain("You talk it through together");
    expect(html).toContain("Sessions are unhurried and private");
    expect(html).toContain("Which Reading Fits You?");
    expect(html).toContain(
      "Each consultation is built around a different question. Choose the one that&#x27;s closest to yours — Nilima will guide the rest.",
    );
    expect(html).toContain('href="/book/">Book a Consultation</a>');
    expect(html).not.toContain('href="tel:');
    expect(html).not.toContain('href="https://wa.me/');
  });

  it("presents the five reading areas without turning them into duplicate booking products", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html.match(/class="service-card"/g)).toHaveLength(5);
    expect(html).not.toContain("service-card__facts");
    expect(html).not.toContain("service-card__action");
  });

  it("uses the footer for identity and practical trust links instead of another booking button", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain("Personal Kundli consultations with Nilima Sawane · Hindi and Marathi · Online");
    expect(html).toContain('href="/#consultation">What she reads</a>');
    expect(html).toContain('href="/#contact">Get in touch</a>');
    expect(html).not.toContain('class="button button--primary site-footer__booking"');
  });
});
