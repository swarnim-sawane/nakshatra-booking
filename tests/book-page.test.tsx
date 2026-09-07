import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { getRouteKind } from "../src/App";
import BookPage from "../src/pages/BookPage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Cal ID booking page", () => {
  it("fails closed when no validated Cal ID event URL is available", () => {
    const html = renderToStaticMarkup(<BookPage bookingUrl={null} />);

    expect(html).toContain("Online booking is being connected");
    expect(html).not.toMatch(/<iframe\b/i);
    expect(html).not.toMatch(/razorpay_order_id|payment successful|localStorage/i);
  });

  it("embeds only the supplied validated Cal ID URL with a safe direct fallback", () => {
    const html = renderToStaticMarkup(
      <BookPage bookingUrl={new URL("https://cal.id/example/consultation")} />,
    );

    expect(html).toContain('<iframe class="booking-embed__frame"');
    expect(html).toContain('title="Book a private consultation with Celestial Guidance"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('src="https://cal.id/example/consultation"');
    expect(html).toContain('href="https://cal.id/example/consultation"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Retry calendar");
    expect(html).not.toMatch(/razorpay_order_id|payment successful|localStorage/i);
  });

  it("fails closed when a caller supplies a URL outside Cal ID", () => {
    const html = renderToStaticMarkup(<BookPage bookingUrl={new URL("https://example.com/consultation")} />);

    expect(html).toContain("Online booking is being connected");
    expect(html).not.toMatch(/<iframe\b/i);
    expect(html).not.toContain("https://example.com/consultation");
  });

  it("renders the booking route from pathname without touching or exposing an opaque token", () => {
    const opaqueToken = "opaque-test-token";
    vi.stubGlobal("window", {
      location: {
        pathname: "/book/",
        get search() {
          throw new Error("The booking route must not read window.location.search.");
        },
      },
    });

    const html = renderToStaticMarkup(<App />);

    expect(getRouteKind("/book/")).toBe("booking");
    expect(html).toContain("Book a time that feels right.");
    expect(html).not.toContain(opaqueToken);
  });
});
