// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
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

  it("links each reading straight to its event without forwarding the opaque token", () => {
    render(<BookPage serviceEnvironment={serviceEnvironment} />);

    const personal = screen.getByRole<HTMLAnchorElement>("link", {
      name: /personal consultation/i,
    });
    const relationship = screen.getByRole<HTMLAnchorElement>("link", {
      name: /relationship consultation/i,
    });
    const bestDate = screen.getByRole<HTMLAnchorElement>("link", {
      name: /muhurat/i,
    });

    expect(personal.href).toBe(serviceEnvironment.PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL);
    expect(relationship.href).toBe(
      serviceEnvironment.PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL,
    );
    expect(bestDate.href).toBe(serviceEnvironment.PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL);
    expect(personal.target).toBe("");
    expect(relationship.target).toBe("");
    expect(bestDate.target).toBe("");
    expect(document.body.textContent).not.toContain("opaque-test-token");
    expect(document.querySelector(".availability-calendar")).toBeNull();
    expect(window.location.search).toBe("?s=opaque-test-token");
  });
});
