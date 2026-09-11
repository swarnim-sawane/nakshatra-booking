import { describe, expect, it, vi } from "vitest";
import { createWhatsAppWebhookFetchHandler } from "../api/whatsapp-webhook";
import { createWhatsAppWebhookSignature } from "../src/server/whatsAppWebhook";

const verifyToken = "test-only-verify-token-with-sufficient-length";
const appSecret = "test-only-meta-app-secret-with-sufficient-length";
const encoder = new TextEncoder();

function createHandler(environment: Record<string, string | undefined> = {}) {
  return createWhatsAppWebhookFetchHandler({
    environment: {
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: verifyToken,
      META_APP_SECRET: appSecret,
      ...environment,
    },
  });
}

async function signedPost(body: string, signatureOverride?: string) {
  const rawBody = encoder.encode(body);
  const signature = signatureOverride ?? await createWhatsAppWebhookSignature(appSecret, rawBody);
  return createHandler()(new Request("https://nilima.example/api/whatsapp-webhook", {
    method: "POST",
    headers: { "x-hub-signature-256": signature },
    body,
  }));
}

describe("WhatsApp webhook receiver", () => {
  it("returns Meta's challenge only when the verification token matches", async () => {
    const handler = createHandler();
    const accepted = await handler(new Request(
      `https://nilima.example/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=challenge-123`,
    ));
    const rejected = await handler(new Request(
      "https://nilima.example/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-123",
    ));

    expect(accepted.status).toBe(200);
    expect(accepted.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(accepted.headers.get("cache-control")).toBe("no-store");
    expect(await accepted.text()).toBe("challenge-123");
    expect(rejected.status).toBe(403);
  });

  it("fails closed when the verification token is not configured", async () => {
    const handler = createHandler({ WHATSAPP_WEBHOOK_VERIFY_TOKEN: "" });
    const response = await handler(new Request(
      "https://nilima.example/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=anything&hub.challenge=challenge-123",
    ));

    expect(response.status).toBe(503);
  });

  it("accepts a signature-verified WhatsApp messages event without echoing its content", async () => {
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{
        id: "waba-123",
        changes: [{
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { phone_number_id: "sender-123" },
            contacts: [{ wa_id: "919999999999" }],
            messages: [{ id: "wamid.private", text: { body: "private consultation text" } }],
          },
        }],
      }],
    });

    const response = await signedPost(body);
    const responseText = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(responseText)).toEqual({ received: true });
    expect(responseText).not.toContain("919999999999");
    expect(responseText).not.toContain("private consultation text");
  });

  it("rejects an invalid signature before parsing the request body", async () => {
    const response = await signedPost("not-json", `sha256=${"0".repeat(64)}`);

    expect(response.status).toBe(401);
  });

  it("rejects a correctly signed malformed payload", async () => {
    const response = await signedPost("not-json");

    expect(response.status).toBe(400);
  });

  it("acknowledges unsupported signed webhook objects without processing them", async () => {
    const response = await signedPost(JSON.stringify({ object: "page", entry: [] }));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ received: true, ignored: true });
  });

  it("rejects an oversized declared body before buffering it", async () => {
    const handler = createHandler();
    const request = new Request("https://nilima.example/api/whatsapp-webhook", {
      method: "POST",
      headers: {
        "content-length": String(256 * 1_024 + 1),
        "x-hub-signature-256": `sha256=${"0".repeat(64)}`,
      },
      body: "{}",
    });
    const arrayBuffer = vi.spyOn(request, "arrayBuffer");

    const response = await handler(request);

    expect(response.status).toBe(413);
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("fails closed for POST when the Meta app secret is not configured", async () => {
    const handler = createHandler({ META_APP_SECRET: "" });
    const response = await handler(new Request("https://nilima.example/api/whatsapp-webhook", {
      method: "POST",
      body: "{}",
    }));

    expect(response.status).toBe(503);
  });

  it("deduplicates inbound messages and sends the deterministic website menu once", async () => {
    const claimed = new Set<string>();
    const storedIds: string[] = [];
    const sent: Array<{ recipientE164: string; payload: Record<string, unknown> }> = [];
    const automation = {
      expectedBusinessAccountId: "waba-123",
      expectedPhoneNumberId: "sender-123",
      siteOrigin: "https://nilima.example",
      store: {
        claimWhatsAppInboundDelivery: async (eventId: string) => {
          storedIds.push(eventId);
          if (claimed.has(eventId)) return false;
          claimed.add(eventId);
          return true;
        },
        completeWhatsAppInboundDelivery: vi.fn(),
      },
      sendMessage: async (recipientE164: string, payload: Record<string, unknown>) => {
        sent.push({ recipientE164, payload });
      },
      notifyHumanHelp: vi.fn(),
    };
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{
        id: "waba-123",
        changes: [{
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { phone_number_id: "sender-123" },
            messages: [{ id: "wamid.private", from: "919999999999", text: { body: "hello" }, type: "text" }],
          },
        }],
      }],
    });
    const rawBody = encoder.encode(body);
    const request = {
      method: "POST",
      url: "https://nilima.example/api/whatsapp-webhook",
      rawBody,
      signature: await createWhatsAppWebhookSignature(appSecret, rawBody),
      appSecret,
      automation,
    };

    const first = await (await import("../src/server/whatsAppWebhook")).handleWhatsAppWebhookRequest(request as never);
    const duplicate = await (await import("../src/server/whatsAppWebhook")).handleWhatsAppWebhookRequest(request as never);

    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.recipientE164).toBe("+919999999999");
    expect(JSON.stringify(sent[0]?.payload)).toContain("Book a consultation");
    expect(JSON.stringify(sent[0]?.payload)).toContain("Manage booking");
    expect(JSON.stringify(sent[0]?.payload)).toContain("Consultation information");
    expect(JSON.stringify(sent[0]?.payload)).toContain("Human help");
    expect(storedIds[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(storedIds)).not.toContain("private");
    expect(JSON.stringify(storedIds)).not.toContain("hello");
  });

  it("routes a human-help keyword through the existing admin notification path", async () => {
    const notifyHumanHelp = vi.fn().mockResolvedValue(undefined);
    const sent: Record<string, unknown>[] = [];
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{
        id: "waba-123",
        changes: [{
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { phone_number_id: "sender-123" },
            messages: [{ id: "wamid.help", from: "919999999999", text: { body: "human help" }, type: "text" }],
          },
        }],
      }],
    });
    const rawBody = encoder.encode(body);
    const response = await (await import("../src/server/whatsAppWebhook")).handleWhatsAppWebhookRequest({
      method: "POST",
      url: "https://nilima.example/api/whatsapp-webhook",
      rawBody,
      signature: await createWhatsAppWebhookSignature(appSecret, rawBody),
      appSecret,
      automation: {
        expectedBusinessAccountId: "waba-123",
        expectedPhoneNumberId: "sender-123",
        siteOrigin: "https://nilima.example",
        store: {
          claimWhatsAppInboundDelivery: vi.fn().mockResolvedValue(true),
          completeWhatsAppInboundDelivery: vi.fn(),
        },
        sendMessage: async (_recipientE164: string, payload: Record<string, unknown>) => { sent.push(payload); },
        notifyHumanHelp,
      },
    } as never);

    expect(response.status).toBe(200);
    expect(notifyHumanHelp).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(sent)).toContain("Nilima has been notified");
  });
});
