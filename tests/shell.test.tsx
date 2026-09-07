import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("application shell", () => {
  it("keeps navigation and booking access available without unsafe client flow remnants", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('href="#main-content"');
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('href="/book/"');
    expect(html).toContain("header-booking-action");
    expect(html).not.toMatch(/rzp_test_|astrology123|Cal\.com|localStorage/i);
  });
});
