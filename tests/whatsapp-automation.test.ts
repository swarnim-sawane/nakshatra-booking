import { describe, expect, it, vi } from "vitest";
import * as WhatsApp from "../src/server/whatsAppWebhook";

const completeEnvironment = {
  WHATSAPP_ACCESS_TOKEN: "test-access-token-never-used-live",
  WHATSAPP_PHONE_NUMBER_ID: "123456789012345",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "987654321098765",
  WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE: "booking_confirmation",
  WHATSAPP_APPOINTMENT_REMINDER_1H_TEMPLATE: "appointment_reminder_1h",
  WHATSAPP_TEMPLATE_LANGUAGE: "en_US",
  WHATSAPP_DISPATCHER_SECRET: "test-dispatcher-secret-at-least-thirty-two-characters",
  SITE_URL: "https://nilima.example",
};

const job = {
  id: "42",
  kind: "booking_confirmation",
  recipientE164: "+919876543210",
  customerFirstName: "Ananya",
  consultationName: "Personal Consultation",
  startsAt: "2026-09-14T03:30:00.000Z",
  meetingUrl: "https://meet.google.com/abc-defg-hij",
} as const;

function exportedFunction(name: string) {
  return (WhatsApp as Record<string, unknown>)[name];
}

describe("WhatsApp outbound automation", () => {
  it("builds the approved confirmation template with named parameters", () => {
    const build = exportedFunction("buildWhatsAppTemplatePayload");
    const payload = typeof build === "function"
      ? build(job, completeEnvironment)
      : undefined;

    expect(payload).toEqual({
      messaging_product: "whatsapp",
      to: "919876543210",
      type: "template",
      template: {
        name: "booking_confirmation",
        language: { code: "en_US" },
        components: [{
          type: "body",
          parameters: [
            { type: "text", parameter_name: "customer_name", text: "Ananya" },
            { type: "text", parameter_name: "consultation_name", text: "Personal Consultation" },
            { type: "text", parameter_name: "appointment_date", text: "14 September 2026" },
            { type: "text", parameter_name: "appointment_time", text: "9:00 AM" },
            { type: "text", parameter_name: "meeting_link", text: "https://meet.google.com/abc-defg-hij" },
          ],
        }],
      },
    });
  });

  it("authenticates the dispatcher and completes a claimed delivery once", async () => {
    const completed: unknown[][] = [];
    const store = {
      claimDueWhatsAppMessages: vi.fn().mockResolvedValue([job]),
      completeWhatsAppMessageDelivery: vi.fn(async (...args: unknown[]) => { completed.push(args); }),
    };
    const fetchImpl = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ messaging_product: "whatsapp", messages: [{ id: "wamid.provider-secret" }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    const createHandler = exportedFunction("createWhatsAppDispatchHandler");
    const handler = typeof createHandler === "function"
      ? createHandler({ environment: completeEnvironment, store, fetchImpl })
      : undefined;
    const response = handler
      ? await handler(new Request("https://nilima.example/api/whatsapp-dispatch", {
        method: "POST",
        headers: { Authorization: `Bearer ${completeEnvironment.WHATSAPP_DISPATCHER_SECRET}` },
      }))
      : undefined;

    expect(response?.status).toBe(200);
    expect(await response?.json()).toEqual({ claimed: 1, sent: 1, retryable: 0, ambiguous: 0 });
    expect(completed).toHaveLength(1);
    expect(completed[0]?.[0]).toBe("42");
    expect(completed[0]?.[1]).toBe("sent");
    expect(completed[0]?.[2]).toMatch(/^[a-f0-9]{64}$/);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://graph.facebook.com/v23.0/123456789012345/messages",
    );
  });

  it("does not touch the outbox when dispatcher authentication fails", async () => {
    const store = {
      claimDueWhatsAppMessages: vi.fn(),
      completeWhatsAppMessageDelivery: vi.fn(),
    };
    const createHandler = exportedFunction("createWhatsAppDispatchHandler");
    const handler = typeof createHandler === "function"
      ? createHandler({ environment: completeEnvironment, store, fetchImpl: vi.fn() })
      : undefined;
    const response = handler
      ? await handler(new Request("https://nilima.example/api/whatsapp-dispatch", { method: "POST" }))
      : undefined;

    expect(response?.status).toBe(401);
    expect(store.claimDueWhatsAppMessages).not.toHaveBeenCalled();
  });

  it("fails closed when the durable outbox cannot be claimed", async () => {
    const store = {
      claimDueWhatsAppMessages: vi.fn().mockRejectedValue(new Error("database unavailable")),
      completeWhatsAppMessageDelivery: vi.fn(),
    };
    const createHandler = exportedFunction("createWhatsAppDispatchHandler");
    const handler = typeof createHandler === "function"
      ? createHandler({ environment: completeEnvironment, store, fetchImpl: vi.fn() })
      : undefined;
    const response = handler
      ? await handler(new Request("https://nilima.example/api/whatsapp-dispatch", {
        method: "POST",
        headers: { Authorization: `Bearer ${completeEnvironment.WHATSAPP_DISPATCHER_SECRET}` },
      })).catch(() => undefined)
      : undefined;

    expect(response?.status).toBe(503);
    expect(store.completeWhatsAppMessageDelivery).not.toHaveBeenCalled();
  });

  it("retries a definitive Meta rejection but quarantines an ambiguous network result", async () => {
    const outcomes: string[] = [];
    const store = {
      claimDueWhatsAppMessages: vi.fn()
        .mockResolvedValueOnce([job])
        .mockResolvedValueOnce([{ ...job, id: "43" }]),
      completeWhatsAppMessageDelivery: vi.fn(async (_id: string, outcome: string) => { outcomes.push(outcome); }),
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 131000 } }), { status: 500 }))
      .mockRejectedValueOnce(new TypeError("network interrupted"));
    const createHandler = exportedFunction("createWhatsAppDispatchHandler");
    const handler = typeof createHandler === "function"
      ? createHandler({ environment: completeEnvironment, store, fetchImpl })
      : undefined;
    const request = () => new Request("https://nilima.example/api/whatsapp-dispatch", {
      method: "POST",
      headers: { Authorization: `Bearer ${completeEnvironment.WHATSAPP_DISPATCHER_SECRET}` },
    });

    const rejected = handler ? await handler(request()) : undefined;
    const ambiguous = handler ? await handler(request()) : undefined;

    expect(rejected?.status).toBe(503);
    expect(ambiguous?.status).toBe(503);
    expect(outcomes).toEqual(["retry", "ambiguous"]);
  });
});
