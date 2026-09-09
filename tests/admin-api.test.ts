import { describe, expect, it, vi } from "vitest";
import { createAdminBookingsHandler } from "../src/server/adminBookingsApi";
import {
  ADMIN_SESSION_COOKIE,
  base64UrlEncode,
  createAdminPasswordHash,
  createAdminSessionToken,
} from "../src/server/adminAuth";
import { createAdminPushSubscriptionHandler } from "../src/server/adminPushApi";
import { SupabaseAdminStore } from "../src/server/supabaseAdminStore";

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

describe("protected admin APIs", () => {
  it("does not query bookings before authentication", async () => {
    const listBookings = vi.fn();
    const handler = createAdminBookingsHandler({
      environment: (await authContext()).environment,
      store: { listBookings } as unknown as SupabaseAdminStore,
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/bookings"));
    expect(response.status).toBe(401);
    expect(listBookings).not.toHaveBeenCalled();
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
    const handler = createAdminBookingsHandler({
      environment,
      store: { listBookings: vi.fn().mockResolvedValue([booking]) } as unknown as SupabaseAdminStore,
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/bookings", { headers: { cookie } }));
    const serialized = JSON.stringify(await response.json());
    expect(response.status).toBe(200);
    expect(serialized).toContain("Ananya");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("birth");
    expect(serialized).not.toContain("phone");
  });

  it("keeps the Supabase service-role key in server request headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify("applied"), { status: 200 }));
    const store = new SupabaseAdminStore({
      url: "https://project.supabase.co",
      serviceRoleKey: "server-only-service-role",
      fetchImpl,
    });
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
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer server-only-service-role");
    expect(init.body).not.toContain("birth");
    expect(init.body).not.toContain("email");
  });

  it("protects push subscription writes and rejects cross-origin requests", async () => {
    const { environment, cookie } = await authContext();
    const publicKey = base64UrlEncode(new Uint8Array(65).fill(1));
    const vapid = { publicKey, privateKey: base64UrlEncode(new Uint8Array(32).fill(2)), subject: "mailto:owner@example.com" };
    const savePushSubscription = vi.fn();
    const handler = createAdminPushSubscriptionHandler({
      environment,
      store: { savePushSubscription } as unknown as SupabaseAdminStore,
      vapid,
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/push-subscription", {
      method: "POST",
      headers: { cookie, origin: "https://attacker.example", "content-type": "application/json" },
      body: "{}",
    }));
    expect(response.status).toBe(403);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });
});
