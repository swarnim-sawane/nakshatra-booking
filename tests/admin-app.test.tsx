// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminApp from "../src/admin/AdminApp";
import { AdminApiError } from "../src/admin/api";
import { loadDemoBookings, type AdminBooking } from "../src/admin/bookings";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const now = new Date("2026-09-09T04:30:00.000Z");

function realBooking(): AdminBooking {
  return {
    id: "booking-123",
    customerFirstName: "Ananya",
    serviceName: "Personal Consultation",
    startsAt: "2026-09-09T08:00:00.000Z",
    endsAt: "2026-09-09T08:30:00.000Z",
    timezone: "Asia/Kolkata",
    status: "paid",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
  };
}

describe("Nakshatra Admin", () => {
  it("labels explicit development data and prioritizes the next consultation", async () => {
    render(<AdminApp loadBookings={() => loadDemoBookings(now)} now={now} serviceWorkerRegistration={null} />);
    expect(await screen.findByText("Development demo")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Next consultation" })).toBeTruthy();
    expect(screen.getByText("Ananya")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open video call" })).toBeTruthy();
    expect(screen.queryByText(/not connected/i)).toBeNull();
  });

  it("shows real empty data without silently substituting samples", async () => {
    render(<AdminApp loadBookings={async () => []} now={now} serviceWorkerRegistration={null} />);
    expect(await screen.findByRole("heading", { name: "No upcoming consultations" })).toBeTruthy();
    expect(screen.getByText("No appointments in this view.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.queryByText("Development demo")).toBeNull();
  });

  it("opens minimized live booking details", async () => {
    const user = userEvent.setup();
    render(<AdminApp loadBookings={async () => [realBooking()]} now={now} serviceWorkerRegistration={null} />);
    await user.click(await screen.findByRole("button", { name: "View Ananya details" }));
    expect(screen.getByRole("dialog", { name: "Appointment details" })).toBeTruthy();
    expect(screen.getByText("Booking reference")).toBeTruthy();
    expect(screen.queryByText(/email|phone|birth time/i)).toBeNull();
  });

  it("presents sign-in when the protected API returns 401", async () => {
    const loadBookings = vi.fn()
      .mockRejectedValueOnce(new AdminApiError("unauthorized", "expired"))
      .mockResolvedValue([realBooking()]);
    const signIn = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AdminApp loadBookings={loadBookings} signIn={signIn} now={now} serviceWorkerRegistration={null} />);

    expect(await screen.findByRole("heading", { name: "Sign in to Nakshatra Admin" })).toBeTruthy();
    await user.type(screen.getByLabelText("Username"), "nilima");
    await user.type(screen.getByLabelText("Password"), "correct-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(signIn).toHaveBeenCalledWith("nilima", "correct-password"));
    expect(await screen.findByRole("heading", { name: "Next consultation" })).toBeTruthy();
  });

  it("distinguishes offline state from a server error", async () => {
    render(<AdminApp loadBookings={async () => { throw new AdminApiError("offline", "offline"); }} now={now} serviceWorkerRegistration={null} />);
    expect(await screen.findByRole("heading", { name: "You are offline" })).toBeTruthy();
    expect(screen.getByText("Reconnect to view the private schedule.")).toBeTruthy();
  });
});
