const MAX_WEBHOOK_BODY_BYTES = 256 * 1_024;

export const CAL_ID_WEBHOOK_TRIGGERS = [
  "BOOKING_CREATED",
  "BOOKING_PAID",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
] as const;

export const CAL_ID_EVENT_TYPE_SLUGS = [
  "personal-consultation",
  "relationship-consultation",
  "best-date-analysis",
] as const;

export type CalIdWebhookTrigger = (typeof CAL_ID_WEBHOOK_TRIGGERS)[number];
export type CalIdEventTypeSlug = (typeof CAL_ID_EVENT_TYPE_SLUGS)[number];
export type BookingLifecycleStatus =
  | "confirmed"
  | "paid"
  | "rescheduled"
  | "cancelled";

export type CalIdWebhookEvent = Readonly<{
  eventId: string;
  trigger: CalIdWebhookTrigger;
  bookingUid: string;
  eventTypeSlug: CalIdEventTypeSlug;
  customerFirstName: string;
  startsAt: string;
  endsAt: string;
  occurredAt: string;
  receivedAt: string;
  meetingUrl?: string;
  rescheduledFromUid?: string;
}>;

export type BookingLifecycleRecord = Readonly<{
  bookingUid: string;
  eventTypeSlug: CalIdEventTypeSlug;
  customerFirstName: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string;
  status: BookingLifecycleStatus;
  createdAt?: string;
  paidAt?: string;
  rescheduledAt?: string;
  cancelledAt?: string;
  rescheduledFromUid?: string;
  lastEventAt: string;
  updatedAt: string;
}>;

export type CalIdWebhookStoreResult = "applied" | "duplicate";

export interface CalIdWebhookStore {
  applyEvent(event: CalIdWebhookEvent): Promise<CalIdWebhookStoreResult>;
}

export interface CalIdWebhookNotifier {
  notify(event: CalIdWebhookEvent): Promise<void>;
}

type WebhookRequest = {
  method: string;
  rawBody: Uint8Array;
  signature?: string | null;
  secret?: string;
  store?: CalIdWebhookStore;
  notifier?: CalIdWebhookNotifier;
  eventTypeIdMap?: ReadonlyMap<number, CalIdEventTypeSlug>;
  now?: () => Date;
};

export type WebhookResponse = {
  status: number;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });
const supportedTriggers = new Set<string>(CAL_ID_WEBHOOK_TRIGGERS);
const supportedEventTypes = new Set<string>(CAL_ID_EVENT_TYPE_SLUGS);

function jsonResponse(status: number, body: Record<string, unknown>): WebhookResponse {
  return {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
    body,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
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

async function digestSha256(value: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    toArrayBuffer(textEncoder.encode(value)),
  );
  return bytesToHex(new Uint8Array(digest));
}

export async function createCalIdWebhookSignature(
  secret: string,
  rawBody: Uint8Array,
) {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(rawBody),
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function verifyCalIdWebhookSignature(
  signature: string | null | undefined,
  secret: string,
  rawBody: Uint8Array,
) {
  const normalized = signature?.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!normalized || !/^[a-f0-9]{64}$/.test(normalized)) return false;
  const expected = await createCalIdWebhookSignature(secret, rawBody);
  return constantTimeEqual(hexToBytes(normalized), hexToBytes(expected));
}

function normalizeIsoTimestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function normalizeBookingUid(value: unknown) {
  if (typeof value !== "string") return null;
  const uid = value.trim();
  return /^[A-Za-z0-9_-]{1,200}$/.test(uid) ? uid : null;
}

function normalizeFirstName(payload: Record<string, unknown>) {
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const attendee = attendees.find(isObject);
  const rawName = attendee && typeof attendee.name === "string" ? attendee.name : "";
  const firstName = rawName.trim().split(/\s+/u)[0]?.slice(0, 80) ?? "";
  return firstName || "Customer";
}

function normalizeMeetingUrl(payload: Record<string, unknown>) {
  const metadata = isObject(payload.metadata) ? payload.metadata : {};
  const candidates = [metadata.videoCallUrl, payload.videoCallUrl, payload.meetingUrl];

  for (const value of candidates) {
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && !url.username && !url.password) {
        return url.href.slice(0, 2_048);
      }
    } catch {
      // Ignore malformed or non-URL provider metadata.
    }
  }
  return undefined;
}

function laterTimestamp(left: string | undefined, right: string) {
  if (!left) return right;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

function deriveStatus(record: Omit<BookingLifecycleRecord, "status">) {
  const rescheduled = record.rescheduledAt
    ? new Date(record.rescheduledAt).getTime()
    : Number.NEGATIVE_INFINITY;
  const cancelled = record.cancelledAt
    ? new Date(record.cancelledAt).getTime()
    : Number.NEGATIVE_INFINITY;

  if (cancelled >= rescheduled && Number.isFinite(cancelled)) return "cancelled";
  if (Number.isFinite(rescheduled)) return "rescheduled";
  if (record.paidAt) return "paid";
  return "confirmed";
}

export function transitionBookingLifecycle(
  current: BookingLifecycleRecord | undefined,
  event: CalIdWebhookEvent,
): BookingLifecycleRecord {
  const eventIsNewest =
    !current || new Date(event.occurredAt).getTime() >= new Date(current.lastEventAt).getTime();
  const next = {
    bookingUid: event.bookingUid,
    eventTypeSlug: eventIsNewest ? event.eventTypeSlug : current.eventTypeSlug,
    customerFirstName: eventIsNewest ? event.customerFirstName : current.customerFirstName,
    startsAt: eventIsNewest ? event.startsAt : current.startsAt,
    endsAt: eventIsNewest ? event.endsAt : current.endsAt,
    meetingUrl: eventIsNewest ? event.meetingUrl : current.meetingUrl,
    createdAt: current?.createdAt,
    paidAt: current?.paidAt,
    rescheduledAt: current?.rescheduledAt,
    cancelledAt: current?.cancelledAt,
    rescheduledFromUid: current?.rescheduledFromUid ?? event.rescheduledFromUid,
    lastEventAt: laterTimestamp(current?.lastEventAt, event.occurredAt),
    updatedAt: laterTimestamp(current?.updatedAt, event.receivedAt),
  } satisfies Omit<BookingLifecycleRecord, "status">;

  if (event.trigger === "BOOKING_CREATED") {
    next.createdAt = laterTimestamp(next.createdAt, event.occurredAt);
  } else if (event.trigger === "BOOKING_PAID") {
    next.paidAt = laterTimestamp(next.paidAt, event.occurredAt);
  } else if (event.trigger === "BOOKING_RESCHEDULED") {
    next.rescheduledAt = laterTimestamp(next.rescheduledAt, event.occurredAt);
  } else {
    next.cancelledAt = laterTimestamp(next.cancelledAt, event.occurredAt);
  }

  return { ...next, status: deriveStatus(next) };
}

export async function projectCalIdWebhookEvent(
  parsed: unknown,
  receivedAt: string,
  eventTypeIdMap: ReadonlyMap<number, CalIdEventTypeSlug> = new Map(),
) {
  if (!isObject(parsed)) return { error: "Invalid webhook payload." } as const;

  const trigger = parsed.triggerEvent;
  if (typeof trigger !== "string" || !supportedTriggers.has(trigger)) {
    return { ignored: true } as const;
  }

  const payload = parsed.payload;
  if (!isObject(payload)) return { error: "Invalid webhook payload." } as const;

  const typeValue = payload.type;
  const idValue = payload.eventTypeId;
  const eventTypeSlug =
    typeof typeValue === "string" && supportedEventTypes.has(typeValue)
      ? (typeValue as CalIdEventTypeSlug)
      : typeof idValue === "number" && Number.isInteger(idValue)
        ? eventTypeIdMap.get(idValue)
        : undefined;
  if (!eventTypeSlug) return { ignored: true } as const;

  const bookingUid = normalizeBookingUid(payload.uid);
  const occurredAt = normalizeIsoTimestamp(parsed.createdAt);
  const startsAt = normalizeIsoTimestamp(payload.startTime);
  const endsAt = normalizeIsoTimestamp(payload.endTime);
  if (!bookingUid || !occurredAt || !startsAt || !endsAt) {
    return { error: "Invalid webhook payload." } as const;
  }

  const rescheduledFromUid = normalizeBookingUid(payload.rescheduleUid);
  const meetingUrl = normalizeMeetingUrl(payload);
  const stableDeliveryKey = [
    trigger,
    bookingUid,
    occurredAt,
    startsAt,
    endsAt,
    rescheduledFromUid ?? "",
  ].join("\n");
  const event: CalIdWebhookEvent = {
    eventId: await digestSha256(stableDeliveryKey),
    trigger: trigger as CalIdWebhookTrigger,
    bookingUid,
    eventTypeSlug,
    customerFirstName: normalizeFirstName(payload),
    startsAt,
    endsAt,
    occurredAt,
    receivedAt,
    ...(meetingUrl ? { meetingUrl } : {}),
    ...(rescheduledFromUid ? { rescheduledFromUid } : {}),
  };

  return { event } as const;
}

export async function handleCalIdWebhookRequest({
  method,
  rawBody,
  signature,
  secret,
  store,
  notifier,
  eventTypeIdMap = new Map(),
  now = () => new Date(),
}: WebhookRequest): Promise<WebhookResponse> {
  if (method !== "POST") return jsonResponse(405, { error: "Method not allowed." });
  if (!secret?.trim()) {
    return jsonResponse(503, { error: "Webhook receiver is not configured." });
  }
  if (rawBody.byteLength === 0) return jsonResponse(400, { error: "Webhook body is required." });
  if (rawBody.byteLength > MAX_WEBHOOK_BODY_BYTES) {
    return jsonResponse(413, { error: "Webhook body is too large." });
  }
  if (!(await verifyCalIdWebhookSignature(signature, secret.trim(), rawBody))) {
    return jsonResponse(401, { error: "Invalid webhook signature." });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textDecoder.decode(rawBody));
  } catch {
    return jsonResponse(400, { error: "Invalid webhook payload." });
  }

  const projected = await projectCalIdWebhookEvent(
    parsed,
    now().toISOString(),
    eventTypeIdMap,
  );
  if ("ignored" in projected) return jsonResponse(202, { received: true, ignored: true });
  if ("error" in projected) return jsonResponse(400, { error: projected.error });
  if (!store) return jsonResponse(503, { error: "Webhook storage is not configured." });

  try {
    const result = await store.applyEvent(projected.event);
    if (notifier) await notifier.notify(projected.event);
    return jsonResponse(200, { received: true, duplicate: result === "duplicate" });
  } catch {
    return jsonResponse(503, { error: "Webhook processing is temporarily unavailable." });
  }
}
