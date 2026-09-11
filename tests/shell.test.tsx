import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App, * as appModule from "../src/App";

type MetadataSelectorModule = {
  getPageMetadata?: (pathname: string) => { title: string; description: string };
};

describe("application shell", () => {
  it("keeps navigation and booking access available without unsafe client flow remnants", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('href="#main-content"');
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('href="/book/"');
    expect(html).toContain(
      'class="button button--primary header-booking-action header-booking-action--mobile" href="/book/">Book consultation</a>',
    );
    for (const label of ["About Nilima", "What she reads", "How it works", "Get in touch"]) {
      expect(html).toContain(label);
    }
    expect(html).not.toMatch(/rzp_test_|astrology123|Cal\.com|localStorage/i);
  });

  it("keeps document-only metadata out of the server-rendered application body", () => {
    const html = renderToStaticMarkup(<App pathname="/book/" />);

    expect(html).not.toMatch(/<(?:title|meta)\b/i);
  });

  it("renders a branded recovery page for an unknown path", () => {
    const html = renderToStaticMarkup(<App pathname="/missing-page" />);

    expect(html).toContain("Page not found");
    expect(html).toContain('href="/">Return home</a>');
    expect(html).toContain('href="/#consultation">View consultations</a>');
    expect(html.match(/src="\/brand\/icon-192\.png"/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it.each([
    [
      "/",
      "Nakshatra | Personal Kundli consultations with Nilima Sawane",
      "A personal astrology consultation built around your birth chart for questions about marriage, career, family and important decisions.",
    ],
    [
      "/book/",
      "Book a Kundli consultation | Nakshatra",
      "Choose a personal consultation, Kundli Milan or Muhurat reading with Nilima Sawane and view available consultation times.",
    ],
  ])("selects the correct metadata for %s", (pathname, title, description) => {
    const getPageMetadata = (appModule as MetadataSelectorModule).getPageMetadata;

    expect(getPageMetadata).toBeTypeOf("function");
    expect(getPageMetadata?.(pathname)).toEqual({ title, description });
  });

  it("uses the Nakshatra brand throughout the rendered shell", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html).toContain('aria-label="Nakshatra"');
    expect(html.match(/class="brand__mark"/g)).toHaveLength(2);
    expect(html.match(/src="\/brand\/icon-192.png"/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(html.match(/class="brand__wordmark"/g)).toHaveLength(2);
    expect(html.match(/Nakshatra/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain("Celestial Guidance");
  });

  it("shows real social icons with configured destinations in the header and footer", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html.match(/aria-label="Instagram"/g)).toHaveLength(3);
    expect(html.match(/aria-label="Facebook"/g)).toHaveLength(3);
    expect(html).toContain('href="https://www.instagram.com/nakshatra.placeholder/"');
    expect(html).toContain('href="https://www.facebook.com/nakshatra.placeholder/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer noopener"');
    expect(html).not.toContain("Coming soon");
    expect(html).toContain(
      'aria-label="Social profiles" class="social-links header-socials header-socials--mobile" role="group"',
    );
    expect(html).not.toContain(
      '<nav aria-label="Social profiles" class="social-links header-socials header-socials--mobile"',
    );
  });
});
