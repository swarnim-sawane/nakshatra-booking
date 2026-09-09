// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminApp from "../src/admin/AdminApp";
import { loadDemoBookings } from "../src/admin/bookings";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const now = new Date("2026-09-09T04:30:00.000Z");

describe("Nakshatra Admin", () => {
  it("identifies sample data and prioritizes the next consultation", async () => {
    render(<AdminApp loadBookings={() => loadDemoBookings(now)} now={now} />);

    expect(await screen.findByText("Prototype — sample bookings")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Next consultation" })).toBeTruthy();
    expect(screen.getByText("Ananya")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Join Google Meet" })).toBeTruthy();
    const summary = screen.getByRole("region", { name: "Appointment summary" });
    expect(summary.textContent).toContain("2today");
  });

  it("filters today and opens booking details", async () => {
    const user = userEvent.setup();
    render(<AdminApp loadBookings={() => loadDemoBookings(now)} now={now} />);
    await screen.findByText("Prototype — sample bookings");

    await user.click(screen.getByRole("button", { name: "Today" }));
    const details = screen.getAllByRole("button", { name: /view .* details/i });
    expect(details).toHaveLength(2);

    await user.click(details[0]);
    expect(screen.getByRole("dialog", { name: "Appointment details" })).toBeTruthy();
    expect(screen.getByText("Sample reference")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Close appointment details" }));
    expect(screen.queryByRole("dialog", { name: "Appointment details" })).toBeNull();
  });

  it("keeps appointments recoverable when the loader fails", async () => {
    const loadBookings = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementation(() => loadDemoBookings(now));
    const user = userEvent.setup();
    render(<AdminApp loadBookings={loadBookings} now={now} />);

    expect(await screen.findByText("Appointments are unavailable right now.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Next consultation" })).toBeTruthy();
    expect(loadBookings).toHaveBeenCalledTimes(2);
  });

  it("explains that notification testing is not live booking delivery", async () => {
    vi.stubGlobal("Notification", {
      permission: "granted",
    });
    const showNotification = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <AdminApp
        loadBookings={() => loadDemoBookings(now)}
        now={now}
        serviceWorkerRegistration={{
          showNotification,
        } as unknown as ServiceWorkerRegistration}
      />,
    );

    await screen.findByText("Prototype — sample bookings");
    expect(
      screen.getByText("Device-only test. Live booking alerts are not connected yet."),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Send test notification" }));
    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Test notification sent to this device.")).toBeTruthy();
  });
});
