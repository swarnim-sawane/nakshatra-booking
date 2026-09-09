import { describe, expect, it, vi } from "vitest";
import { createAdminBookingsHandler } from "../src/server/adminBookingsApi";
import {
  ADMIN_SESSION_COOKIE,
  base64UrlEncode,
  createAdminPasswordHash,
  createAdminSessionToken,
} from "../src/server/adminAuth";
import { createAdminPushSubscriptionHandler } from "../src/server/adminPushApi";
import {
  NeonAdminStore,
  type AdminDataStore,
  type NeonQuery,
} from "../src/server/neonAdminStore";

const now = new Date("2026-09-09T12:00:00.000Z");

async function authContext() {
  const environment = {
    ADMIN_USERNAME: "nilima",
    ADMIN_PASSWORD_HASH: await createAdminPasswordHash("owner-password-123!", 100_000, new Uint8Array(16).fill(4)),
    ADMIN_SESSION_SECRET: "a".repeat(48),
  };
  const token = await createAdminSessionToken("nilima", environment.ADMIN_SESSION_SECRET, now);
  return { environment, cookie: `${ADMIN_SESSION_COOKIE}=${token}` };
}

function storeWith(overrides: Partial<AdminDataStore> = {}) {
  return {
    applyEvent: vi.fn(),
    listBookings: vi.fn().mockResolvedValue([]),
    deleteBooking: vi.fn(),
    savePushSubscription: vi.fn(),
    deletePushSubscription: vi.fn(),
    getPushSubscription: vi.fn(),
    listPushSubscriptions: vi.fn(),
    claimPushDelivery: vi.fn(),
    completePushDelivery: vi.fn(),
    ...overrides,
  } as AdminDataStore;
}

describe("protected admin APIs", () => {
  it("does not query bookings before authentication", async () => {
    const store = storeWith();
    const handler = createAdminBookingsHandler({
      environment: (await authContext()).environment,
      store,
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/bookings"));
    expect(response.status).toBe(401);
    expect(store.listBookings).not.toHaveBeenCalled();
  });

  it("returns only the minimized booking projection after authentication", async () => {
    const { environment, cookie } = await authContext();
    const booking = {
      id: "booking_123",
      customerFirstName: "Ananya",
      serviceName: "Personal Consultation",
      startsAt: "2026-09-14T03:30:00.000Z",
      endsAt: "2026-09-14T04:00:00.000Z",
      timezone: "Asia/Kolkata" as const,
      status: "paid" as const,
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    };
    const store = storeWith({ listBookings: vi.fn().mockResolvedValue([booking]) });
    const handler = createAdminBookingsHandler({ environment, store, now: () => now });
    const response = await handler(new Request("https://nilima.example/api/admin/bookings", { headers: { cookie } }));
    const serialized = JSON.stringify(await response.json());
    expect(response.status).toBe(200);
    expect(store.listBookings).toHaveBeenCalledWith(now);
    expect(serialized).toContain("Ananya");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("birth");
    expect(serialized).not.toContain("phone");
  });

  it("uses the server-only Neon URL and parameterized function calls", async () => {
    const databaseUrl = "postgresql://nakshatra_runtime:server-secret@ep-example-pooler.neon.tech/neondb?sslmode=require";
    const query = vi.fn().mockResolvedValue([{ result: "applied" }]);
    const createQuery = vi.fn(() => query as NeonQuery);
    const store = new NeonAdminStore({ databaseUrl, createQuery });
    await store.applyEvent({
      eventId: "event-1",
      trigger: "BOOKING_CREATED",
      bookingUid: "booking-1",
      eventTypeSlug: "personal-consultation",
      customerFirstName: "Ananya",
      startsAt: "2026-09-14T03:30:00.000Z",
      endsAt: "2026-09-14T04:00:00.000Z",
      occurredAt: "2026-09-09T10:00:00.000Z",
      receivedAt: "2026-09-09T10:00:01.000Z",
    });
    expect(createQuery).toHaveBeenCalledWith(databaseUrl);
    const [statement, parameters] = query.mock.calls[0];
    expect(statement).toContain("$1::text");
    expect(statement).not.toContain("Ananya");
    expect(JSON.stringify(parameters)).not.toContain("server-secret");
    expect(JSON.stringify(parameters)).not.toContain("birth");
    expect(JSON.stringify(parameters)).not.toContain("email");
  });

  it("protects push subscription writes and rejects cross-origin requests", async () => {
    const { environment, cookie } = await authContext();
    const publicKey = base64UrlEncode(new Uint8Array(65).fill(1));
    const vapid = { publicKey, privateKey: base64UrlEncode(new Uint8Array(32).fill(2)), subject: "mailto:owner@example.com" };
    const store = storeWith();
    const handler = createAdminPushSubscriptionHandler({ environment, store, vapid, now: () => now });
    const response = await handler(new Request("https://nilima.example/api/admin/push-subscription", {
      method: "POST",
      headers: { cookie, origin: "https://attacker.example", "content-type": "application/json" },
      body: "{}",
    }));
    expect(response.status).toBe(403);
    expect(store.savePushSubscription).not.toHaveBeenCalled();
  });

  it("does not allow an unauthenticated or cross-origin booking removal", async () => {
    const { environment, cookie } = await authContext();
    const store = storeWith();
    const handler = createAdminBookingsHandler({ environment, store, now: () => now });
    const request = (headers: Record<string, string>) => new Request("https://nilima.example/api/admin/bookings", {
      method: "DELETE",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ bookingUid: "booking_123" }),
    });
    expect((await handler(request({ origin: "https://nilima.example" }))).status).toBe(401);
    expect((await handler(request({ cookie, origin: "https://attacker.example" }))).status).toBe(403);
    expect(store.deleteBooking).not.toHaveBeenCalled();
  });

  it("removes eligible records but protects active future appointments", async () => {
    const { environment, cookie } = await authContext();
    const deleteBooking = vi.fn()
      .mockResolvedValueOnce("active")
      .mockResolvedValueOnce("deleted");
    const handler = createAdminBookingsHandler({
      environment,
      store: storeWith({ deleteBooking }),
      now: () => now,
    });
    const request = () => new Request("https://nilima.example/api/admin/bookings", {
      method: "DELETE",
      headers: { cookie, origin: "https://nilima.example", "content-type": "application/json" },
      body: JSON.stringify({ bookingUid: "booking_123" }),
    });
    expect((await handler(request())).status).toBe(409);
    expect((await handler(request())).status).toBe(200);
    expect(deleteBooking).toHaveBeenNthCalledWith(1, "booking_123", now);
  });
});
