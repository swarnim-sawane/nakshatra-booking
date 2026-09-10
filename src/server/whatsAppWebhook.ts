export const MAX_WHATSAPP_WEBHOOK_BODY_BYTES = 256 * 1_024;

export type WhatsAppWebhookResponse = {
  status: number;
  headers: Record<string, string>;
  body: string | Record<string, unknown>;
};

type WhatsAppWebhookRequest = {
  method: string;
  url: string;
  rawBody: Uint8Array;
  signature?: string | null;
  verifyToken?: string;
  appSecret?: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): WhatsAppWebhookResponse {
  return {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
    body,
  };
}

function plainTextResponse(status: number, body: string): WhatsAppWebhookResponse {
  return {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
    body,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function constantTimeTextEqual(left: string, right: string) {
  return constantTimeEqual(textEncoder.encode(left), textEncoder.encode(right));
}

export async function createWhatsAppWebhookSignature(
  appSecret: string,
  rawBody: Uint8Array,
) {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(rawBody),
  );
  return `sha256=${bytesToHex(new Uint8Array(signature))}`;
}

export async function verifyWhatsAppWebhookSignature(
  signature: string | null | undefined,
  appSecret: string,
  rawBody: Uint8Array,
) {
  const normalized = signature?.trim().toLowerCase();
  if (!normalized || !/^sha256=[a-f0-9]{64}$/.test(normalized)) return false;
  const expected = await createWhatsAppWebhookSignature(appSecret, rawBody);
  return constantTimeEqual(
    hexToBytes(normalized.slice("sha256=".length)),
    hexToBytes(expected.slice("sha256=".length)),
  );
}

function containsMessagesChange(parsed: unknown) {
  if (!isObject(parsed) || parsed.object !== "whatsapp_business_account") return false;
  if (!Array.isArray(parsed.entry)) return false;

  return parsed.entry.some((entry) => {
    if (!isObject(entry) || !Array.isArray(entry.changes)) return false;
    return entry.changes.some((change) => isObject(change) && change.field === "messages");
  });
}

function handleVerification(url: string, verifyToken: string | undefined) {
  if (!verifyToken?.trim()) {
    return jsonResponse(503, { error: "Webhook verification is not configured." });
  }

  const searchParams = new URL(url).searchParams;
  const mode = searchParams.get("hub.mode");
  const suppliedToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (
    mode !== "subscribe"
    || !suppliedToken
    || !challenge
    || challenge.length > 1_024
    || !constantTimeTextEqual(suppliedToken, verifyToken.trim())
  ) {
    return jsonResponse(403, { error: "Webhook verification failed." });
  }

  return plainTextResponse(200, challenge);
}

export async function handleWhatsAppWebhookRequest({
  method,
  url,
  rawBody,
  signature,
  verifyToken,
  appSecret,
}: WhatsAppWebhookRequest): Promise<WhatsAppWebhookResponse> {
  if (method === "GET") return handleVerification(url, verifyToken);
  if (method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." }, { Allow: "GET, POST" });
  }
  if (!appSecret?.trim()) {
    return jsonResponse(503, { error: "Webhook receiver is not configured." });
  }
  if (rawBody.byteLength === 0) {
    return jsonResponse(400, { error: "Webhook body is required." });
  }
  if (rawBody.byteLength > MAX_WHATSAPP_WEBHOOK_BODY_BYTES) {
    return jsonResponse(413, { error: "Webhook body is too large." });
  }
  if (!(await verifyWhatsAppWebhookSignature(signature, appSecret.trim(), rawBody))) {
    return jsonResponse(401, { error: "Invalid webhook signature." });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textDecoder.decode(rawBody));
  } catch {
    return jsonResponse(400, { error: "Invalid webhook payload." });
  }

  if (!containsMessagesChange(parsed)) {
    return jsonResponse(202, { received: true, ignored: true });
  }
  return jsonResponse(200, { received: true });
}
