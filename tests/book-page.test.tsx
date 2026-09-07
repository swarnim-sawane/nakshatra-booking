import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { getRouteKind } from "../src/App";
import {
  DEFAULT_CAL_ID_BOOKING_URL,
  DEFAULT_CAL_ID_EVENT_URLS,
} from "../src/config/scheduling";
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
      <BookPage bookingUrl={new URL(DEFAULT_CAL_ID_BOOKING_URL)} />,
    );

    expect(html).toContain('<iframe class="booking-embed__frame"');
    expect(html).toContain('title="Book a private consultation with Celestial Guidance"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('scrolling="no"');
    expect(html).toContain(`src="${DEFAULT_CAL_ID_BOOKING_URL}"`);
    expect(html).toContain(`href="${DEFAULT_CAL_ID_BOOKING_URL}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Retry calendar");
    expect(html).not.toMatch(/razorpay_order_id|payment successful|localStorage/i);
  });

  it("renders hash-only selectors for all three readings and announces the active selection", () => {
    const html = renderToStaticMarkup(
      <BookPage
        bookingUrl={new URL(DEFAULT_CAL_ID_BOOKING_URL)}
        initialHash="#relationship-consultation"
      />,
    );

    expect(html).toContain('href="#personal-consultation"');
    expect(html).toContain('href="#relationship-consultation"');
    expect(html).toContain('href="#best-date-analysis"');
    expect(html).not.toMatch(/href="[^\"]*\?/);
    expect(html).toMatch(
      /href="#relationship-consultation"[^>]*aria-current="true"/,
    );
  });

  it("repeats the selected reading's exact details before the scheduler", () => {
    const html = renderToStaticMarkup(
      <BookPage
        bookingUrl={new URL(DEFAULT_CAL_ID_BOOKING_URL)}
        initialHash="#best-date-analysis"
      />,
    );
    const selectedSummary = html.match(
      /<section class="booking-page__selection"[^>]*>(.*?)<\/section>/s,
    )?.[1];

    expect(selectedSummary).toContain("Best Date Analysis");
    expect(selectedSummary).toContain("30 minutes");
    expect(selectedSummary).toContain("₹500");
    expect(selectedSummary).toContain(
      "Your birth details, event type, preferred date range, location, and constraints.",
    );
  });

  it("uses the selected service's validated event URL without changing the destination", () => {
    const eventUrl = "https://cal.id/nilima-sawane/best-date-analysis";
    const html = renderToStaticMarkup(
      <BookPage
        initialHash="#best-date-analysis"
        serviceEnvironment={{ PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL: eventUrl }}
      />,
    );

    expect(html).toContain(`src="${eventUrl}"`);
    expect(html).toContain(`href="${eventUrl}"`);
    expect(html).not.toContain(`${eventUrl}#best-date-analysis`);
  });

  it("keeps the exact direct-event default for an unconfigured service", () => {
    const html = renderToStaticMarkup(
      <BookPage initialHash="#relationship-consultation" serviceEnvironment={{}} />,
    );

    expect(html).toContain(
      `src="${DEFAULT_CAL_ID_EVENT_URLS["relationship-consultation"]}"`,
    );
    expect(html).toContain(
      `href="${DEFAULT_CAL_ID_EVENT_URLS["relationship-consultation"]}"`,
    );
  });

  it("fails closed when a caller supplies a URL outside Cal ID", () => {
    const html = renderToStaticMarkup(<BookPage bookingUrl={new URL("https://example.com/consultation")} />);

    expect(html).toContain("Online booking is being connected");
    expect(html).not.toMatch(/<iframe\b/i);
    expect(html).not.toContain("https://example.com/consultation");
  });

  it("selects from the hash without touching or exposing an opaque query token", () => {
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
    expect(html).toContain("Book a time that feels right.");
    expect(html).toContain("Relationship Consultation");
    expect(html).not.toContain(opaqueToken);
  });
});
