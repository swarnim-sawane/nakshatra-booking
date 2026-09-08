// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import BookPage from "../src/pages/BookPage";

const serviceEnvironment = {
  PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL:
    "https://cal.id/nilima-sawane/personal-consultation?duration=60",
  PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL:
    "https://cal.id/nilima-sawane/relationship-consultation?duration=60",
  PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL:
    "https://cal.id/nilima-sawane/best-date-analysis?duration=30",
};

function activeChoice() {
  return document.querySelector<HTMLAnchorElement>(
    '.service-selector__option[aria-current="true"]',
  );
}

function bookingLink() {
  return screen.getByRole<HTMLAnchorElement>("link", {
    name: /continue to secure booking/i,
  });
}

describe("booking service interactions", () => {
  beforeEach(() => {
    window.history.replaceState(
      {},
      "",
      "/book/?s=opaque-test-token#personal-consultation",
    );
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("keeps selection, hash navigation, calendar URL, and token isolation in sync", async () => {
    const user = userEvent.setup();
    render(<BookPage serviceEnvironment={serviceEnvironment} />);

    expect(activeChoice()?.textContent).toContain("Personal Consultation");
    expect(bookingLink().href).toBe(serviceEnvironment.PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL);
    expect(document.querySelector("iframe")).toBeNull();

    await user.click(
      screen.getByRole("link", { name: /relationship consultation/i }),
    );

    await waitFor(() => {
      expect(window.location.hash).toBe("#relationship-consultation");
      expect(activeChoice()?.textContent).toContain("Relationship Consultation");
      expect(screen.getByRole("heading", { name: "Relationship Consultation" })).toBeTruthy();
      expect(bookingLink().href).toBe(
        serviceEnvironment.PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL,
      );
    });

    act(() => {
      window.location.hash = "#best-date-analysis";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(activeChoice()?.textContent).toContain("Best Date Analysis");
    expect(screen.getByRole("heading", { name: "Best Date Analysis" })).toBeTruthy();
    expect(bookingLink().href).toBe(serviceEnvironment.PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL);

    act(() => {
      window.location.hash = "#relationship-consultation";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(activeChoice()?.textContent).toContain("Relationship Consultation");
    expect(document.body.textContent).not.toContain("opaque-test-token");
    expect(bookingLink().href).not.toContain("opaque-test-token");
    expect(bookingLink().target).toBe("");
    expect(window.location.search).toBe("?s=opaque-test-token");
  });
});
