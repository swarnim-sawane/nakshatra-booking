import { describe, expect, it, vi } from "vitest";
import {
  createCalIdWebhookSignature,
  handleCalIdWebhookRequest,
  transitionBookingLifecycle,
  type BookingLifecycleRecord,
  type CalIdWebhookEvent,
  type CalIdWebhookStore,
} from "../src/server/calIdWebhook";
import { createCalIdWebhookFetchHandler } from "../api/cal-id-webhook";

const secret = "test-only-webhook-secret-with-sufficient-length";
const encoder = new TextEncoder();

class MemoryWebhookStore implements CalIdWebhookStore {
  readonly events: CalIdWebhookEvent[] = [];
  readonly bookings = new Map<string, BookingLifecycleRecord>();
  private readonly eventIds = new Set<string>();

  async applyEvent(event: CalIdWebhookEvent) {
    if (this.eventIds.has(event.eventId)) return "duplicate" as const;
    this.eventIds.add(event.eventId);
    this.events.push(event);
    this.bookings.set(event.bookingUid, transitionBookingLifecycle(this.bookings.get(event.bookingUid), event));
    return "applied" as const;
  }
}

function webhookBody(triggerEvent: string, createdAt: string, payload: Record<string, unknown> = {}) {
  return JSON.stringify({
    triggerEvent,
    createdAt,
    payload: {
      type: "personal-consultation",
      uid: "booking_uid_123",
      startTime: "2026-09-14T03:30:00.000Z",
      endTime: "2026-09-14T04:00:00.000Z",
      attendees: [{ email: "private@example.com", name: "Ananya Sharma" }],
      ...payload,
    },
  });
}

async function signedRequest(store: CalIdWebhookStore, body: string, signatureOverride?: string) {
  const rawBody = encoder.encode(body);
  const signature = signatureOverride ?? await createCalIdWebhookSignature(secret, rawBody);
  return handleCalIdWebhookRequest({
    method: "POST",
    rawBody,
    signature,
    secret,
    store,
    now: () => new Date("2026-09-09T12:00:00.000Z"),
  });
}

describe("Cal ID webhook receiver", () => {
  it("rejects an invalid raw-body signature before persistence", async () => {
    const store = new MemoryWebhookStore();
    const response = await signedRequest(store, webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z"), "0".repeat(64));
    expect(response.status).toBe(401);
    expect(store.events).toHaveLength(0);
  });

  it("deduplicates retries even if equivalent JSON is formatted differently", async () => {
    const store = new MemoryWebhookStore();
    const original = webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z");
    const reformatted = JSON.stringify(JSON.parse(original), null, 2);
    expect((await signedRequest(store, original)).body).toEqual({ received: true, duplicate: false });
    expect((await signedRequest(store, reformatted)).body).toEqual({ received: true, duplicate: true });
    expect(store.events).toHaveLength(1);
  });

  it("does not recreate a removed customer row when Cal ID retries the retained delivery", async () => {
    const store = new MemoryWebhookStore();
    const body = webhookBody("BOOKING_CANCELLED", "2026-09-09T10:00:00.000Z");
    expect((await signedRequest(store, body)).body).toEqual({ received: true, duplicate: false });
    store.bookings.delete("booking_uid_123");
    expect((await signedRequest(store, body)).body).toEqual({ received: true, duplicate: true });
    expect(store.bookings.has("booking_uid_123")).toBe(false);
  });

  it("does not send an alert when retention suppresses a late lifecycle event", async () => {
    const body = webhookBody("BOOKING_PAID", "2026-09-09T10:05:00.000Z");
    const rawBody = encoder.encode(body);
    const notifier = { notify: vi.fn() };
    const response = await handleCalIdWebhookRequest({
      method: "POST",
      rawBody,
      signature: await createCalIdWebhookSignature(secret, rawBody),
      secret,
      store: { applyEvent: vi.fn().mockResolvedValue("suppressed") },
      notifier,
    });
    expect(response.body).toEqual({ received: true, duplicate: false, suppressed: true });
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("does not regress when payment arrives before creation", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(store, webhookBody("BOOKING_PAID", "2026-09-09T10:05:00.000Z"));
    await signedRequest(store, webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z"));
    expect(store.bookings.get("booking_uid_123")).toMatchObject({
      status: "paid",
      createdAt: "2026-09-09T10:00:00.000Z",
      paidAt: "2026-09-09T10:05:00.000Z",
    });
  });

  it("lets the latest terminal lifecycle event win", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(store, webhookBody("BOOKING_RESCHEDULED", "2026-09-09T11:00:00.000Z", { rescheduleUid: "booking_uid_old" }));
    await signedRequest(store, webhookBody("BOOKING_CANCELLED", "2026-09-09T11:30:00.000Z"));
    await signedRequest(store, webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z"));
    expect(store.bookings.get("booking_uid_123")).toMatchObject({
      status: "cancelled",
      rescheduledFromUid: "booking_uid_old",
      rescheduledAt: "2026-09-09T11:00:00.000Z",
      cancelledAt: "2026-09-09T11:30:00.000Z",
    });
  });

  it("projects the customer details Nilima needs to prepare the Kundli", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(store, webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z", {
      attendees: [{
        email: "ananya@example.com",
        name: "Ananya Sharma",
        phoneNumber: "+91 98111 22334",
      }],
      responses: {
        preferred_language: { value: "Hindi" },
        date_of_birth: { value: "12/02/1990" },
        time_of_birth: { value: "10:35 AM" },
        birth_time_accuracy: { value: "Exact" },
        place_of_birth: { value: "Pune, Maharashtra, India" },
        consultation_questions: { value: "Career change and marriage timing" },
        unrelated_private_answer: { value: "must not be copied" },
      },
      additionalNotes: "Please speak in Hindi.",
      metadata: { videoCallUrl: "https://meet.google.com/abc-defg-hij" },
    }));
    const persisted = JSON.stringify(store.events);
    expect(persisted).not.toContain("must not be copied");
    expect(store.events[0]).toMatchObject({
      customerFirstName: "Ananya",
      customerFullName: "Ananya Sharma",
      customerEmail: "ananya@example.com",
      customerPhoneNumber: "+919811122334",
      preferredLanguage: "Hindi",
      birthDate: "12/02/1990",
      birthTime: "10:35 AM",
      birthTimeAccuracy: "Exact",
      birthPlace: "Pune, Maharashtra, India",
      consultationQuestions: "Career change and marriage timing",
      additionalNotes: "Please speak in Hindi.",
      startsAt: "2026-09-14T03:30:00.000Z",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
  });

  it("projects an E.164 recipient only with explicit transactional WhatsApp consent", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(store, webhookBody("BOOKING_PAID", "2026-09-09T10:05:00.000Z", {
      responses: {
        whatsapp_phone: { value: "+91 98765 43210" },
        whatsapp_transactional_opt_in: { value: true },
        date_of_birth: { value: "1990-01-01" },
        consultation_questions: { value: "private family question" },
      },
    }));

    expect(store.events[0]).toMatchObject({
      whatsappRecipientE164: "+919876543210",
      whatsappTransactionalConsent: true,
    });
    const projected = JSON.stringify(store.events[0]);
    expect(projected).toContain("1990-01-01");
    expect(projected).toContain("private family question");
  });

  it("fails closed for WhatsApp when either phone or explicit consent is absent", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(store, webhookBody("BOOKING_PAID", "2026-09-09T10:05:00.000Z", {
      responses: {
        whatsapp_phone: { value: "+919876543210" },
        whatsapp_transactional_opt_in: { value: false },
      },
    }));

    expect(store.events[0]).not.toHaveProperty("whatsappRecipientE164");
    expect(store.events[0]).not.toHaveProperty("whatsappTransactionalConsent");
  });

  it("reads exact Request bytes and triggers privacy-safe delivery", async () => {
    const store = new MemoryWebhookStore();
    const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const body = webhookBody("BOOKING_PAID", "2026-09-09T10:05:00.000Z");
    const signature = await createCalIdWebhookSignature(secret, encoder.encode(body));
    const handler = createCalIdWebhookFetchHandler({
      environment: { CALID_WEBHOOK_SECRET: secret },
      store,
      notifier,
    });
    const response = await handler(new Request("https://nilima.example/api/cal-id-webhook", {
      method: "POST",
      headers: { "x-cal-signature-256": signature },
      body,
    }));
    expect(response.status).toBe(200);
    expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({ trigger: "BOOKING_PAID" }));
  });

  it("rejects an oversized declared body before buffering it", async () => {
    const store = new MemoryWebhookStore();
    const handler = createCalIdWebhookFetchHandler({
      environment: { CALID_WEBHOOK_SECRET: secret },
      store,
    });
    const request = new Request("https://nilima.example/api/cal-id-webhook", {
      method: "POST",
      headers: { "content-length": String(256 * 1_024 + 1) },
      body: "{}",
    });
    const arrayBuffer = vi.spyOn(request, "arrayBuffer");

    const response = await handler(request);

    expect(response.status).toBe(413);
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(store.events).toHaveLength(0);
  });

  it("cancels a streaming body as soon as the byte limit is crossed", async () => {
    const store = new MemoryWebhookStore();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(256 * 1_024));
        controller.enqueue(new Uint8Array([1]));
      },
      cancel() {
        cancelled = true;
      },
    });
    const handler = createCalIdWebhookFetchHandler({
      environment: { CALID_WEBHOOK_SECRET: secret },
      store,
    });
    const request = new Request("https://nilima.example/api/cal-id-webhook", {
      method: "POST",
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const response = await handler(request);

    expect(response.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(store.events).toHaveLength(0);
  });

  it("fails closed without durable storage", async () => {
    const body = webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z");
    const rawBody = encoder.encode(body);
    const response = await handleCalIdWebhookRequest({
      method: "POST",
      rawBody,
      signature: await createCalIdWebhookSignature(secret, rawBody),
      secret,
    });
    expect(response.status).toBe(503);
  });

  it("returns retryable failure when durable notification delivery fails", async () => {
    const store = new MemoryWebhookStore();
    const body = webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z");
    const rawBody = encoder.encode(body);
    const response = await handleCalIdWebhookRequest({
      method: "POST",
      rawBody,
      signature: await createCalIdWebhookSignature(secret, rawBody),
      secret,
      store,
      notifier: { notify: vi.fn().mockRejectedValue(new Error("push failed")) },
    });
    expect(response.status).toBe(503);
    expect(store.events).toHaveLength(1);
  });
});
