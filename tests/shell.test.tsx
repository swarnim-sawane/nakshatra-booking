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
      'class="button button--primary header-booking-action header-booking-action--mobile" href="/book/">Book</a>',
    );
    expect(html).not.toMatch(/rzp_test_|astrology123|Cal\.com|localStorage/i);
  });

  it("keeps document-only metadata out of the server-rendered application body", () => {
    const html = renderToStaticMarkup(<App pathname="/book/" />);

    expect(html).not.toMatch(/<(?:title|meta)\b/i);
  });

  it.each([
    [
      "/",
      "Celestial Guidance",
      "Private astrology consultations with Nilima Sawane for personal insight, relationships, and meaningful timing.",
    ],
    [
      "/book/",
      "Book | Celestial Guidance",
      "Choose a reading and book a private Google Meet consultation with Nilima Sawane.",
    ],
  ])("selects the correct metadata for %s", (pathname, title, description) => {
    const getPageMetadata = (appModule as MetadataSelectorModule).getPageMetadata;

    expect(getPageMetadata).toBeTypeOf("function");
    expect(getPageMetadata?.(pathname)).toEqual({ title, description });
  });
});
