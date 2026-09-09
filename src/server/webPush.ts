import { base64UrlDecode, base64UrlEncode } from "./adminAuth";
import type {
  CalIdWebhookEvent,
  CalIdWebhookNotifier,
  CalIdWebhookTrigger,
} from "./calIdWebhook";
import type {
  AdminDataStore,
  StoredPushSubscription,
} from "./neonAdminStore";

export type VapidEnvironment = Readonly<{
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}>;

export type VapidConfig = Readonly<{
  publicKey: string;
  privateKey: string;
  subject: string;
}>;

type PushSendResult = "sent" | "gone";

const encoder = new TextEncoder();

function concatBytes(...parts: Uint8Array[]) {
  const combined = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.byteLength;
  }
  return combined;
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function uint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, bits: number) {
  const key = await crypto.subtle.importKey("raw", toArrayBuffer(ikm), "HKDF", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: toArrayBuffer(salt), info: toArrayBuffer(info) },
      key,
      bits,
    ),
  );
}

export function readVapidConfig(environment: VapidEnvironment): VapidConfig | null {
  const publicKey = environment.VAPID_PUBLIC_KEY?.trim();
  const privateKey = environment.VAPID_PRIVATE_KEY?.trim();
  const subject = environment.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;

  try {
    if (base64UrlDecode(publicKey).byteLength !== 65) return null;
    if (base64UrlDecode(privateKey).byteLength !== 32) return null;
    if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) return null;
    return { publicKey, privateKey, subject };
  } catch {
    return null;
  }
}

async function createVapidAuthorization(endpoint: string, config: VapidConfig, now = new Date()) {
  const publicKey = base64UrlDecode(config.publicKey);
  const privateKey = base64UrlDecode(config.privateKey);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: base64UrlEncode(publicKey.slice(1, 33)),
      y: base64UrlEncode(publicKey.slice(33, 65)),
      d: base64UrlEncode(privateKey),
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(now.getTime() / 1_000) + 12 * 60 * 60,
        sub: config.subject,
      }),
    ),
  );
  const unsigned = `${header}.${payload}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      encoder.encode(unsigned),
    ),
  );
  return `vapid t=${unsigned}.${base64UrlEncode(signature)}, k=${config.publicKey}`;
}

async function encryptPushPayload(subscription: StoredPushSubscription, payload: string) {
  const receiverPublicKey = base64UrlDecode(subscription.keys.p256dh);
  const authSecret = base64UrlDecode(subscription.keys.auth);
  if (receiverPublicKey.byteLength !== 65 || receiverPublicKey[0] !== 4 || authSecret.byteLength < 16) {
    throw new Error("Invalid push subscription keys");
  }

  const receiverKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(receiverPublicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const senderKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: receiverKey },
      senderKeys.privateKey,
      256,
    ),
  );
  const senderPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeys.publicKey));
  const keyInfo = concatBytes(
    encoder.encode("WebPush: info"),
    new Uint8Array([0]),
    receiverPublicKey,
    senderPublicKey,
  );
  const ikm = await hkdf(sharedSecret, authSecret, keyInfo, 256);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const contentEncryptionKey = await hkdf(
    ikm,
    salt,
    concatBytes(encoder.encode("Content-Encoding: aes128gcm"), new Uint8Array([0])),
    128,
  );
  const nonce = await hkdf(
    ikm,
    salt,
    concatBytes(encoder.encode("Content-Encoding: nonce"), new Uint8Array([0])),
    96,
  );
  const aesKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(contentEncryptionKey),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const record = concatBytes(encoder.encode(payload), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: toArrayBuffer(nonce), tagLength: 128 },
      aesKey,
      toArrayBuffer(record),
    ),
  );
  return concatBytes(
    salt,
    uint32(4_096),
    new Uint8Array([senderPublicKey.byteLength]),
    senderPublicKey,
    ciphertext,
  );
}

export function privacySafeNotification(trigger: CalIdWebhookTrigger | "TEST") {
  const body = "Open Nakshatra Admin for details.";
  if (trigger === "BOOKING_RESCHEDULED") {
    return { title: "Consultation rescheduled", body, tag: "nakshatra-booking-update" };
  }
  if (trigger === "BOOKING_CANCELLED") {
    return { title: "Consultation cancelled", body, tag: "nakshatra-booking-update" };
  }
  if (trigger === "TEST") {
    return { title: "Nakshatra notifications are ready", body, tag: "nakshatra-admin-test" };
  }
  if (trigger === "BOOKING_PAID") {
    return { title: "Consultation payment confirmed", body, tag: "nakshatra-new-booking" };
  }
  return { title: "New consultation booked", body, tag: "nakshatra-new-booking" };
}

export async function sendWebPush(
  subscription: StoredPushSubscription,
  trigger: CalIdWebhookTrigger | "TEST",
  config: VapidConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<PushSendResult> {
  const endpoint = new URL(subscription.endpoint);
  if (endpoint.protocol !== "https:") throw new Error("Push endpoint must use HTTPS");
  const notification = privacySafeNotification(trigger);
  const encrypted = await encryptPushPayload(
    subscription,
    JSON.stringify({ ...notification, url: "/admin/" }),
  );
  const response = await fetchImpl(endpoint.href, {
    method: "POST",
    headers: {
      Authorization: await createVapidAuthorization(endpoint.href, config),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "300",
      Urgency: "high",
    },
    body: toArrayBuffer(encrypted),
  });
  if (response.status === 404 || response.status === 410) return "gone";
  if (!response.ok) throw new Error(`Push service returned ${response.status}`);
  return "sent";
}

export class DurablePushNotifier implements CalIdWebhookNotifier {
  constructor(
    private readonly store: AdminDataStore,
    private readonly config: VapidConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async notify(event: CalIdWebhookEvent) {
    const trigger = await this.store.claimPushDelivery(event.eventId);
    if (!trigger) return;

    try {
      const subscriptions = await this.store.listPushSubscriptions();
      for (const subscription of subscriptions) {
        const result = await sendWebPush(subscription, trigger, this.config, this.fetchImpl);
        if (result === "gone") await this.store.deletePushSubscription(subscription.endpoint);
      }
      await this.store.completePushDelivery(event.eventId, true);
    } catch (error) {
      const errorCode = error instanceof Error && /\b\d{3}\b/.test(error.message)
        ? error.message.match(/\b\d{3}\b/)?.[0]
        : "delivery-failed";
      await this.store.completePushDelivery(event.eventId, false, errorCode);
      throw new Error("Push delivery failed");
    }
  }
}
