import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("application shell", () => {
  it("keeps navigation and booking access available without unsafe client flow remnants", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('href="#main-content"');
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('href="/book/"');
    expect(html).toContain(
      'class="button button--primary header-booking-action header-booking-action--mobile" href="/book/">Book</a>',
    );
    expect(html).not.toMatch(/rzp_test_|astrology123|Cal\.com|localStorage/i);
  });

  it.each([
    [
      "/",
      "Celestial Guidance",
      "Private one-to-one astrology consultations with a clear route to booking.",
    ],
    [
      "/book/",
      "Book | Celestial Guidance",
      "Choose a time for a private one-to-one astrology consultation.",
    ],
  ])("renders the correct metadata for %s", (pathname, title, description) => {
    const html = renderToStaticMarkup(<App pathname={pathname} />);

    expect(html).toContain(`<title>${title}</title>`);
    expect(html).toMatch(
      new RegExp(`<meta(?=[^>]*name="description")(?=[^>]*content="${description}")[^>]*/>`),
    );
  });
});
