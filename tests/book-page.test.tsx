import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { getRouteKind } from "../src/App";
import { DEFAULT_CAL_ID_EVENT_URLS } from "../src/config/scheduling";
import BookPage from "../src/pages/BookPage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Cal ID booking page", () => {
  it("sends every service row directly to its same-tab Cal ID event", () => {
    const html = renderToStaticMarkup(<BookPage />);

    expect(html).toContain(`href="${DEFAULT_CAL_ID_EVENT_URLS["personal-consultation"]}"`);
    expect(html).toContain(`href="${DEFAULT_CAL_ID_EVENT_URLS["relationship-consultation"]}"`);
    expect(html).toContain(`href="${DEFAULT_CAL_ID_EVENT_URLS["best-date-analysis"]}"`);
    expect(html.match(/class="service-selector__card/g)).toHaveLength(3);
    expect(html.match(/View times and book/g)).toHaveLength(3);
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toContain("aria-current");
  });

  it("does not render a second calendar after the direct booking choices", () => {
    const html = renderToStaticMarkup(<BookPage />);

    expect(html).not.toContain('class="availability-calendar"');
    expect(html).not.toMatch(/aria-label="[^"]+ availability"/);
    expect(html).not.toContain("See all available times");
    expect(html).not.toContain("Choose your time");
  });

  it("presents each reading with its own editorial photograph", () => {
    const html = renderToStaticMarkup(<BookPage />);

    expect(html.match(/src="\/images\/consultation-desk\.webp"/g)).toHaveLength(1);
    expect(html).toContain('src="/images/relationship-consultation.webp"');
    expect(html).toContain('src="/images/best-date-analysis.webp"');
    expect(html).toContain("A full personal consultation for when you");
    expect(html).toContain("A compatibility reading that looks at where two charts align");
    expect(html).toContain("Timing for weddings, ceremonies, and other important dates.");
    expect(html).not.toMatch(/>\s*PRO\s*</i);
  });

  it("uses one booking-page introduction without a repeated selector heading or kicker", () => {
    const html = renderToStaticMarkup(<BookPage />);

    expect(html).toContain("Get in Touch");
    expect(html).toContain("Book a Consultation");
    expect(html).toContain(
      "To book a reading, share your birth details and a short note on what you",
    );
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).not.toContain("service-selector__heading");
    expect(html).not.toContain("service-selector__kicker");
    expect(html).not.toContain("Private consultation");
  });

  it("uses each configured event URL without leaking another service's destination", () => {
    const relationshipUrl = "https://cal.id/nilima-sawane/relationship-consultation-v2";
    const html = renderToStaticMarkup(
      <BookPage
        serviceEnvironment={{
          PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL: relationshipUrl,
        }}
      />,
    );

    expect(html).toContain(`href="${relationshipUrl}"`);
    expect(html).toContain(`href="${DEFAULT_CAL_ID_EVENT_URLS["personal-consultation"]}"`);
    expect(html).not.toContain(`${relationshipUrl}#relationship-consultation`);
  });

  it("selects the booking route without touching or exposing an opaque query token", () => {
    const opaqueToken = "opaque-test-token";
    vi.stubGlobal("window", {
      location: {
        pathname: "/book/",
        hash: "#relationship-consultation",
        get search() {
          throw new Error("The booking route must not read window.location.search.");
        },
      },
    });

    const html = renderToStaticMarkup(<App />);

    expect(getRouteKind("/book/")).toBe("booking");
    expect(html).toContain("Book a Consultation");
    expect(html).toContain("Relationship Consultation");
    expect(html).not.toContain(opaqueToken);
  });

  it("classifies unknown paths as not found", () => {
    expect(getRouteKind("/missing-page")).toBe("not-found");
  });
});
