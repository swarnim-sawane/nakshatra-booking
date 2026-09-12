import { describe, expect, it, vi } from "vitest";
import { NeonAdminStore } from "../src/server/neonAdminStore";

describe("Neon WhatsApp automation boundary", () => {
  it("passes only consent-gated E.164 data into the atomic lifecycle function", async () => {
    const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
    const store = new NeonAdminStore({
      databaseUrl: "postgresql://runtime:password@example.test/nakshatra",
      createQuery: () => async (statement, parameters = []) => {
        calls.push({ statement, parameters });
        return [{ result: "applied" }];
      },
    });

    await store.applyEvent({
      eventId: "a".repeat(64),
      trigger: "BOOKING_PAID",
      bookingUid: "booking-123",
      eventTypeSlug: "personal-consultation",
      customerFirstName: "Ananya",
      customerFullName: "Ananya Sharma",
      startsAt: "2026-09-14T03:30:00.000Z",
      endsAt: "2026-09-14T04:00:00.000Z",
      occurredAt: "2026-09-09T10:05:00.000Z",
      receivedAt: "2026-09-09T12:00:00.000Z",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      whatsappRecipientE164: "+919876543210",
      whatsappTransactionalConsent: true,
    });

    expect(calls[0]?.statement).toContain("apply_calid_webhook_event_with_customer_details");
    expect(calls[0]?.parameters.slice(10, 12)).toEqual(["+919876543210", true]);
  });

  it("maps due outbox rows without exposing intake answers", async () => {
    const query = vi.fn().mockResolvedValue([{
      delivery_id: "42",
      message_kind: "appointment_reminder_1h",
      whatsapp_recipient_e164: "+919876543210",
      customer_first_name: "Ananya",
      event_type_slug: "relationship-consultation",
      starts_at: "2026-09-14T03:30:00.000Z",
      meeting_url: "https://meet.google.com/abc-defg-hij",
    }]);
    const store = new NeonAdminStore({
      databaseUrl: "postgresql://runtime:password@example.test/nakshatra",
      createQuery: () => query,
    }) as NeonAdminStore & { claimDueWhatsAppMessages?: (limit: number) => Promise<unknown[]> };

    const rows = store.claimDueWhatsAppMessages
      ? await store.claimDueWhatsAppMessages(10)
      : undefined;

    expect(rows).toEqual([{
      id: "42",
      kind: "appointment_reminder_1h",
      recipientE164: "+919876543210",
      customerFirstName: "Ananya",
      consultationName: "Relationship Consultation (Kundli Milan)",
      startsAt: "2026-09-14T03:30:00.000Z",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    }]);
  });
});
