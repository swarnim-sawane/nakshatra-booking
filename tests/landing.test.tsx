import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("booking-first landing journey", () => {
  it("renders the complete truthful consultation path with booking access", () => {
    const html = renderToStaticMarkup(<App pathname="/" />);

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const sectionId of ["about", "consultation", "experience", "approach", "contact"]) {
      expect(html).toContain(`id="${sectionId}"`);
    }
    expect(html.indexOf('id="about"')).toBeLessThan(html.indexOf('id="consultation"'));
    expect(html.indexOf('id="about"')).toBeLessThan(html.indexOf('id="reviews"'));
    expect(html.indexOf('id="reviews"')).toBeLessThan(html.indexOf('id="consultation"'));
    expect(html.match(/href="\/book\/"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(html).not.toMatch(/1000\+|98%|4\.9\/5|Professional Photo/);
  });
});
