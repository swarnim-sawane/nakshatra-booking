import { describe, expect, it } from "vitest";
import {
  canRemoveBooking,
  filterBookings,
  findNextBooking,
  formatBookingDate,
  formatBookingTime,
  loadDemoBookings,
  safeMeetingUrl,
} from "../src/admin/bookings";

const now = new Date("2026-09-09T04:30:00.000Z");

describe("admin booking domain", () => {
  it("creates chronological fictional bookings relative to the supplied day", async () => {
    const bookings = await loadDemoBookings(now);

    expect(bookings).toHaveLength(6);
    expect(bookings.map((booking) => booking.startsAt)).toEqual(
      [...bookings].map((booking) => booking.startsAt).sort(),
    );
    expect(bookings.every((booking) => booking.isSample)).toBe(true);
    expect(bookings.every((booking) => booking.timezone === "Asia/Kolkata")).toBe(true);
  });

  it("finds the next actionable consultation and filters today", async () => {
    const bookings = await loadDemoBookings(now);
    const next = findNextBooking(bookings, now);

    expect(next?.customerFirstName).toBe("Ananya");
    expect(next?.status).toBe("confirmed");
    expect(filterBookings(bookings, "today", now)).toHaveLength(2);
    expect(filterBookings(bookings, "upcoming", now).every((booking) =>
      new Date(booking.startsAt).getTime() >= now.getTime()
    )).toBe(true);
  });

  it("formats appointment dates and times in India", async () => {
    const bookings = await loadDemoBookings(now);
    const next = findNextBooking(bookings, now)!;

    expect(formatBookingDate(next.startsAt)).toContain("9 September");
    expect(formatBookingTime(next.startsAt)).toMatch(/1:30\s*pm/i);
  });

  it("allows only HTTPS meeting links for active bookings", async () => {
    const bookings = await loadDemoBookings(now);
    const active = bookings.find((booking) => booking.status === "confirmed")!;
    const cancelled = bookings.find((booking) => booking.status === "cancelled")!;

    expect(safeMeetingUrl(active)?.protocol).toBe("https:");
    expect(safeMeetingUrl(cancelled)).toBeNull();
    expect(safeMeetingUrl({ ...active, meetingUrl: "javascript:alert(1)" })).toBeNull();
  });

  it("allows housekeeping only after an appointment ends or is cancelled", async () => {
    const bookings = await loadDemoBookings(now);
    const active = bookings.find((booking) => booking.customerFirstName === "Ananya")!;
    const cancelled = bookings.find((booking) => booking.status === "cancelled")!;
    const endedAtBoundary = { ...active, endsAt: now.toISOString() };

    expect(canRemoveBooking(active, now)).toBe(false);
    expect(canRemoveBooking(cancelled, now)).toBe(true);
    expect(canRemoveBooking(endedAtBoundary, now)).toBe(true);
    expect(canRemoveBooking({ ...endedAtBoundary, endsAt: new Date(now.getTime() + 1).toISOString() }, now)).toBe(false);
  });
});
