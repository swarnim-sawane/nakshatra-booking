import { describe, expect, it } from "vitest";
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
    this.bookings.set(
      event.bookingUid,
      transitionBookingLifecycle(this.bookings.get(event.bookingUid), event),
    );
    return "applied" as const;
  }
}

function webhookBody(
  triggerEvent: string,
  createdAt: string,
  payload: Record<string, unknown> = {},
) {
  return JSON.stringify({
    triggerEvent,
    createdAt,
    payload: {
      type: "personal-consultation",
      uid: "booking_uid_123",
      ...payload,
    },
  });
}

async function signedRequest(
  store: CalIdWebhookStore,
  body: string,
  signatureOverride?: string,
) {
  const rawBody = encoder.encode(body);
  const signature =
    signatureOverride ?? (await createCalIdWebhookSignature(secret, rawBody));
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
  it("rejects an invalid signature before persisting anything", async () => {
    const store = new MemoryWebhookStore();
    const response = await signedRequest(
      store,
      webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z"),
      "0".repeat(64),
    );

    expect(response.status).toBe(401);
    expect(store.events).toHaveLength(0);
  });

  it("deduplicates a repeated delivery by its raw-body digest", async () => {
    const store = new MemoryWebhookStore();
    const body = webhookBody(
      "BOOKING_CREATED",
      "2026-09-09T10:00:00.000Z",
    );

    const first = await signedRequest(store, body);
    const second = await signedRequest(store, body);

    expect(first.body).toEqual({ received: true, duplicate: false });
    expect(second.body).toEqual({ received: true, duplicate: true });
    expect(store.events).toHaveLength(1);
  });

  it("does not regress when payment arrives before booking creation", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(
      store,
      webhookBody("BOOKING_PAID", "2026-09-09T10:05:00.000Z"),
    );
    await signedRequest(
      store,
      webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z"),
    );

    expect(store.bookings.get("booking_uid_123")).toMatchObject({
      status: "paid",
      createdAt: "2026-09-09T10:00:00.000Z",
      paidAt: "2026-09-09T10:05:00.000Z",
    });
  });

  it("applies reschedule and cancellation as idempotent terminal transitions", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(
      store,
      webhookBody("BOOKING_RESCHEDULED", "2026-09-09T11:00:00.000Z", {
        rescheduleUid: "booking_uid_old",
      }),
    );
    await signedRequest(
      store,
      webhookBody("BOOKING_CANCELLED", "2026-09-09T11:30:00.000Z"),
    );
    await signedRequest(
      store,
      webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z"),
    );

    expect(store.bookings.get("booking_uid_123")).toMatchObject({
      status: "cancelled",
      rescheduledFromUid: "booking_uid_old",
      rescheduledAt: "2026-09-09T11:00:00.000Z",
      cancelledAt: "2026-09-09T11:30:00.000Z",
    });
  });

  it("projects only operational fields and drops birth details, notes and email", async () => {
    const store = new MemoryWebhookStore();
    await signedRequest(
      store,
      webhookBody("BOOKING_CREATED", "2026-09-09T10:00:00.000Z", {
        attendees: [{ email: "private@example.com", name: "Private Person" }],
        customInputs: {
          birthDate: "1990-01-01",
          birthTime: "08:30",
          birthPlace: "Pune",
        },
        additionalNotes: "Sensitive family question",
      }),
    );

    const persisted = JSON.stringify(store.events);
    expect(persisted).not.toContain("private@example.com");
    expect(persisted).not.toContain("1990-01-01");
    expect(persisted).not.toContain("Pune");
    expect(persisted).not.toContain("Sensitive family question");
    expect(store.events[0]).toEqual(
      expect.objectContaining({
        trigger: "BOOKING_CREATED",
        bookingUid: "booking_uid_123",
        eventTypeSlug: "personal-consultation",
      }),
    );
  });

  it("reads the exact raw Request bytes in the Vercel fetch adapter", async () => {
    const store = new MemoryWebhookStore();
    const body = webhookBody("BOOKING_PAID", "2026-09-09T10:05:00.000Z");
    const signature = await createCalIdWebhookSignature(secret, encoder.encode(body));
    const fetchHandler = createCalIdWebhookFetchHandler({ secret, store });
    const response = await fetchHandler(
      new Request("https://nilima.example/api/cal-id-webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-cal-signature-256": signature,
        },
        body,
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: false });
  });

  it("uses a configured event type ID when Cal ID sends a display name in type", async () => {
    const store = new MemoryWebhookStore();
    const body = webhookBody(
      "BOOKING_PAID",
      "2026-09-09T10:05:00.000Z",
      { type: "Personal Consultation", eventTypeId: 108657 },
    );
    const rawBody = encoder.encode(body);
    const signature = await createCalIdWebhookSignature(secret, rawBody);
    const response = await handleCalIdWebhookRequest({
      method: "POST",
      rawBody,
      signature,
      secret,
      store,
      eventTypeIdMap: new Map([[108657, "personal-consultation"]]),
    });

    expect(response.status).toBe(200);
    expect(store.events[0].eventTypeSlug).toBe("personal-consultation");
  });

  it("fails closed when durable storage has not been configured", async () => {
    const body = webhookBody(
      "BOOKING_CREATED",
      "2026-09-09T10:00:00.000Z",
    );
    const rawBody = encoder.encode(body);
    const signature = await createCalIdWebhookSignature(secret, rawBody);
    const response = await handleCalIdWebhookRequest({
      method: "POST",
      rawBody,
      signature,
      secret,
    });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: "Webhook storage is not configured.",
    });
  });
});
