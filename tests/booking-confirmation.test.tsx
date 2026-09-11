// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import BookingConfirmationPage, {
  createBookingConfirmation,
} from "../src/pages/BookingConfirmationPage";

function bookingSuccessCallback() {
  const namespace = Object.values(window.Cal?.ns ?? {})[0];
  const command = namespace?.q
    .map((args) => Array.from(args))
    .find(([name, options]) => (
      name === "on" &&
      typeof options === "object" &&
      options !== null &&
      (options as { action?: unknown }).action === "bookingSuccessfulV2"
    ));
  return (command?.[1] as { callback?: (event: unknown) => void } | undefined)?.callback;
}

afterEach(() => {
  cleanup();
  delete window.Cal;
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

describe("booking confirmation", () => {
  it("moves from the Cal ID popup to the first-party page for an accepted booking", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/book/");
    render(<App />);

    await user.click(screen.getByRole("link", { name: /personal consultation/i }));
    const callback = bookingSuccessCallback();
    expect(callback).toBeTypeOf("function");

    act(() => {
      callback?.({
        detail: {
          data: {
            uid: "booking_uid_123",
            status: "ACCEPTED",
            startTime: "2026-09-24T07:30:00.000Z",
            email: "customer@example.com",
          },
        },
      });
    });

    expect(await screen.findByRole("heading", { name: "Your consultation is confirmed." })).toBeTruthy();
    expect(window.location.pathname).toBe("/booking-confirmed/");
    expect(screen.getByText("Personal Consultation")).toBeTruthy();
    expect(window.location.href).not.toContain("booking_uid_123");
    expect(window.location.href).not.toContain("customer@example.com");
    expect(document.body.textContent).not.toContain("customer@example.com");
  });

  it("does not call a pending booking confirmed", () => {
    const confirmation = createBookingConfirmation({
      detail: {
        data: {
          uid: "booking_uid_456",
          status: "pending",
          startTime: "2026-09-24T07:30:00.000Z",
        },
      },
    }, "Muhurat");

    render(<BookingConfirmationPage confirmation={confirmation} />);
    expect(screen.getByRole("heading", { name: "Your booking request has been received." })).toBeTruthy();
    expect(screen.queryByText(/consultation is confirmed/i)).toBeNull();
  });

  it("does not claim success when the confirmation route is opened directly", () => {
    window.history.replaceState({}, "", "/booking-confirmed/");
    render(<BookingConfirmationPage />);
    expect(screen.getByRole("heading", { name: "Please check your confirmation email." })).toBeTruthy();
    expect(screen.queryByText(/consultation is confirmed/i)).toBeNull();
  });

  it("ignores malformed success events", () => {
    expect(createBookingConfirmation({ detail: { data: { status: "accepted" } } }, "Muhurat")).toBeNull();
  });
});
