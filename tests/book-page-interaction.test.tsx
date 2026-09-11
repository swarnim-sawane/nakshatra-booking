// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookPage from "../src/pages/BookPage";

const serviceEnvironment = {
  PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL:
    "https://cal.id/nilima-sawane/personal-consultation?duration=30",
  PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL:
    "https://cal.id/nilima-sawane/relationship-consultation?duration=20",
  PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL:
    "https://cal.id/nilima-sawane/best-date-analysis?duration=10",
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
    cleanup();
    delete window.Cal;
    vi.unstubAllGlobals();
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

  it("opens a responsive booking dialog and returns to the service choices on close", async () => {
    const user = userEvent.setup();
    render(<BookPage serviceEnvironment={serviceEnvironment} />);

    await user.click(screen.getByRole("link", { name: /personal consultation/i }));

    const dialog = screen.getByRole("dialog", { name: "Complete your booking" });
    expect(dialog).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole<HTMLAnchorElement>("link", {
      name: "Open booking in a separate tab",
    }).href).toBe(serviceEnvironment.PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL);

    await user.click(screen.getByRole("button", { name: "Close booking" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("uses the vertical Cal ID layout on a phone without losing service parameters", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: "(max-width: 700px)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })));
    const user = userEvent.setup();
    render(<BookPage serviceEnvironment={serviceEnvironment} />);

    await user.click(screen.getByRole("link", { name: /personal consultation/i }));

    const namespace = Object.values(window.Cal?.ns ?? {})[0];
    const inlineCommand = namespace?.q
      .map((args) => Array.from(args))
      .find(([command]) => command === "inline");

    expect(inlineCommand?.[1]).toMatchObject({
      calLink: "nilima-sawane/personal-consultation?duration=30",
      config: { layout: "column_view" },
    });
  });
});
