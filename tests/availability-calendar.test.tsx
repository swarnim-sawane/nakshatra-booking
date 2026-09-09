// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import AvailabilityCalendar, {
  type AvailabilityPayload,
} from "../src/components/AvailabilityCalendar";
import { consultationServices } from "../src/config/services";

const personalService = consultationServices[0];
const personalBookingUrl = new URL(
  "https://cal.id/nilima-sawane/personal-consultation?duration=60&s=private-token",
);

afterEach(cleanup);

function successfulAvailability(): Promise<AvailabilityPayload> {
  return Promise.resolve({
    service: "personal-consultation",
    timeZone: "Asia/Kolkata",
    slots: [
      "2026-09-08T09:15:00.000Z",
      "2026-09-08T10:15:00.000Z",
      "2026-09-09T09:15:00.000Z",
    ],
  });
}

describe("Nakshatra availability calendar", () => {
  it("turns a real available time into a safe Cal ID checkout handoff", async () => {
    const user = userEvent.setup();
    const loadAvailability = vi.fn(successfulAvailability);

    render(
      <AvailabilityCalendar
        bookingUrl={personalBookingUrl}
        initialMonth={new Date("2026-09-01T00:00:00.000Z")}
        loadAvailability={loadAvailability}
        service={personalService}
        timeZone="Asia/Kolkata"
      />,
    );

    expect(await screen.findByText("September 2026")).toBeTruthy();
    const availableDay = await screen.findByRole("button", {
      name: "Tuesday, 8 September 2026, 2 times available",
    });
    await user.click(availableDay);

    const timeLink = await screen.findByRole<HTMLAnchorElement>("link", {
      name: "2:45 PM",
    });

    expect(timeLink.href).toBe(
      "https://cal.id/nilima-sawane/personal-consultation?duration=60&slot=2026-09-08T09%3A15%3A00.000Z",
    );
    expect(timeLink.target).toBe("");
    expect(timeLink.href).not.toContain("private-token");
    expect(loadAvailability).toHaveBeenCalledTimes(1);
    expect(loadAvailability).toHaveBeenCalledWith({
      end: "2026-09-30T18:30:00.000Z",
      service: "personal-consultation",
      start: "2026-08-31T18:30:00.000Z",
      timeZone: "Asia/Kolkata",
    });
    expect(
      screen.getByText(
        "After choosing a time, you’ll share your birth details and complete the booking.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Secure online booking")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View all available times" })).toBeTruthy();
  });

  it("keeps the direct Cal ID path available if live availability cannot load", async () => {
    const user = userEvent.setup();
    const loadAvailability = vi.fn(() => Promise.reject(new Error("offline")));

    render(
      <AvailabilityCalendar
        bookingUrl={personalBookingUrl}
        initialMonth={new Date("2026-09-01T00:00:00.000Z")}
        loadAvailability={loadAvailability}
        service={personalService}
        timeZone="Asia/Kolkata"
      />,
    );

    await screen.findByText("You can still book your consultation.");
    expect(screen.queryByText("September 2026")).toBeNull();
    expect(screen.queryByRole("button", { name: "Previous month" })).toBeNull();
    expect(document.querySelector(".availability-calendar__footer")).toBeNull();
    const fallback = screen.getByRole<HTMLAnchorElement>("link", {
      name: "Choose a time securely",
    });
    expect(fallback.href).toBe(
      "https://cal.id/nilima-sawane/personal-consultation?duration=60&s=private-token",
    );
    await user.click(screen.getByRole("button", { name: "Refresh calendar" }));
    await waitFor(() => expect(loadAvailability).toHaveBeenCalledTimes(2));
  });

  it("offers button-style actions and fetches the next month from an empty month", async () => {
    const user = userEvent.setup();
    const loadAvailability = vi.fn(() => Promise.resolve({
      service: "personal-consultation" as const,
      slots: [],
      timeZone: "Asia/Kolkata",
    }));

    render(
      <AvailabilityCalendar
        bookingUrl={personalBookingUrl}
        initialMonth={new Date("2026-09-01T00:00:00.000Z")}
        loadAvailability={loadAvailability}
        service={personalService}
        timeZone="Asia/Kolkata"
      />,
    );

    await screen.findByText("No appointments are available this month.");
    const checkNextMonth = screen.getByRole("button", { name: "Check next month" });
    const viewAll = screen.getAllByRole<HTMLAnchorElement>("link", {
      name: "View all available times",
    })[0];

    expect(checkNextMonth.className).toContain("button--secondary");
    expect(viewAll.className).toContain("button--primary");
    expect(viewAll.href).toBe(personalBookingUrl.href);

    await user.click(checkNextMonth);
    expect(await screen.findByText("October 2026")).toBeTruthy();
    await waitFor(() => expect(loadAvailability).toHaveBeenCalledTimes(2));
    expect(loadAvailability).toHaveBeenNthCalledWith(2, {
      end: "2026-10-31T18:30:00.000Z",
      service: "personal-consultation",
      start: "2026-09-30T18:30:00.000Z",
      timeZone: "Asia/Kolkata",
    });
  });

  it("fails closed when no validated booking destination exists", () => {
    render(
      <AvailabilityCalendar
        bookingUrl={null}
        initialMonth={new Date("2026-09-01T00:00:00.000Z")}
        loadAvailability={successfulAvailability}
        service={personalService}
        timeZone="Asia/Kolkata"
      />,
    );

    expect(screen.getByText("Prepare for your consultation.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Choose a time securely" })).toBeNull();
    expect(
      [...document.querySelectorAll<HTMLAnchorElement>("a")].some((link) =>
        link.href.startsWith("https://cal.id/"),
      ),
    ).toBe(false);
  });

  it("does not turn the calendar card into a nested scroll container", () => {
    const style = document.createElement("style");
    style.textContent = readFileSync("src/styles/availability-calendar.css", "utf8");
    document.head.append(style);

    render(
      <AvailabilityCalendar
        bookingUrl={null}
        initialMonth={new Date("2026-09-01T00:00:00.000Z")}
        service={personalService}
        timeZone="Asia/Kolkata"
      />,
    );

    const overflow = getComputedStyle(
      screen.getByText("Prepare for your consultation.").closest("section")!,
    ).overflow;
    expect(["visible", "clip"]).toContain(overflow);

    style.remove();
  });
});
