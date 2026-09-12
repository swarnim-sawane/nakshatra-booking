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
    customerFullName: "Ananya Sharma",
    customerEmail: "ananya@example.com",
    customerPhoneNumber: "+919811122334",
    whatsappRecipientE164: "+919876543210",
    whatsappConsent: true,
    preferredLanguage: "Hindi",
    birthDate: "12/02/1990",
    birthTime: "10:35 AM",
    birthTimeAccuracy: "Exact",
    birthPlace: "Pune, Maharashtra, India",
    consultationQuestions: "Career change and marriage timing",
    additionalNotes: "Please speak in Hindi.",
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
    expect(screen.getByText("Ananya Sharma")).toBeTruthy();
    expect(screen.getByText("12 February 1990")).toBeTruthy();
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

  it("renews the current device subscription when the protected schedule opens", async () => {
    const active = {
      endpoint: "https://push.example.test/active-device",
      toJSON: () => ({
        endpoint: "https://push.example.test/active-device",
        expirationTime: null,
        keys: { p256dh: "public-key", auth: "auth-key" },
      }),
    } as unknown as PushSubscription;
    const registration = {
      pushManager: { getSubscription: vi.fn().mockResolvedValue(active) },
    } as unknown as ServiceWorkerRegistration;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ enabled: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminApp
        loadBookings={async () => [realBooking()]}
        now={now}
        serviceWorkerRegistration={registration}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Next consultation" })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/push-subscription",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    ));
  });

  it("shows the next customer's Kundli preparation details at a glance", async () => {
    render(<AdminApp loadBookings={async () => [realBooking()]} now={now} serviceWorkerRegistration={null} />);
    expect(await screen.findByText("Ananya Sharma")).toBeTruthy();
    expect(screen.getByText("12 February 1990")).toBeTruthy();
    expect(screen.getByText("10:35 AM · Exact")).toBeTruthy();
    expect(screen.getByText("Pune, Maharashtra, India")).toBeTruthy();
    expect(screen.getByText("Career change and marriage timing")).toBeTruthy();
  });

  it("opens the complete protected customer record", async () => {
    const user = userEvent.setup();
    render(<AdminApp loadBookings={async () => [realBooking()]} now={now} serviceWorkerRegistration={null} />);
    await user.click(await screen.findByRole("button", { name: "View Ananya details" }));
    expect(screen.getByRole("dialog", { name: "Appointment details" })).toBeTruthy();
    expect(screen.getByText("Booking reference")).toBeTruthy();
    expect(screen.getAllByText("ananya@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+919811122334").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+919876543210").length).toBeGreaterThan(0);
    expect(screen.getAllByText("WhatsApp allowed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Please speak in Hindi.").length).toBeGreaterThan(0);
  });

  it("requires confirmation before removing a cancelled appointment", async () => {
    const user = userEvent.setup();
    const removeBooking = vi.fn().mockResolvedValue(undefined);
    const cancelled = { ...realBooking(), status: "cancelled" as const };
    render(<AdminApp loadBookings={async () => [cancelled]} removeBooking={removeBooking} now={now} serviceWorkerRegistration={null} />);

    await user.click(await screen.findByRole("button", { name: "View Ananya details" }));
    await user.click(screen.getByRole("button", { name: "Remove from admin" }));
    expect(screen.getByText(/cannot be undone/i)).toBeTruthy();
    expect(removeBooking).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove permanently" }));
    await waitFor(() => expect(removeBooking).toHaveBeenCalledWith("booking-123"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "View Ananya details" })).toBeNull());
  });

  it("does not offer housekeeping removal for an active future appointment", async () => {
    const user = userEvent.setup();
    render(<AdminApp loadBookings={async () => [realBooking()]} now={now} serviceWorkerRegistration={null} />);
    await user.click(await screen.findByRole("button", { name: "View Ananya details" }));
    expect(screen.queryByRole("button", { name: "Remove from admin" })).toBeNull();
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
