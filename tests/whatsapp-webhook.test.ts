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
});
