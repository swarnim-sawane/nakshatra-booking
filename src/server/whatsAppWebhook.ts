import type {
  WhatsAppAutomationStore,
  WhatsAppOutboundJob,
} from "./neonAdminStore.js";

export const MAX_WHATSAPP_WEBHOOK_BODY_BYTES = 256 * 1_024;
const META_GRAPH_VERSION = "v23.0";

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
  automation?: WhatsAppInboundAutomation;
};

export type WhatsAppEnvironment = Readonly<{
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
  WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE?: string;
  WHATSAPP_APPOINTMENT_REMINDER_1H_TEMPLATE?: string;
  WHATSAPP_TEMPLATE_LANGUAGE?: string;
  WHATSAPP_DISPATCHER_SECRET?: string;
  SITE_URL?: string;
}>;

export type WhatsAppConfig = Readonly<{
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  bookingConfirmationTemplate: string;
  appointmentReminderTemplate: string;
  templateLanguage: string;
  dispatcherSecret: string;
  siteOrigin: string;
}>;

type WhatsAppPayload = Record<string, unknown>;

export type WhatsAppDeliveryStatus = Readonly<{
  status: string;
  errorCodes: string[];
}>;

export type WhatsAppInboundAutomation = Readonly<{
  expectedBusinessAccountId: string;
  expectedPhoneNumberId: string;
  siteOrigin: string;
  store: Pick<
    WhatsAppAutomationStore,
    "claimWhatsAppInboundDelivery" | "completeWhatsAppInboundDelivery"
  >;
  sendMessage: (recipientE164: string, payload: WhatsAppPayload) => Promise<void>;
  notifyHumanHelp: () => Promise<void>;
  recordDeliveryStatus?: (deliveryStatus: WhatsAppDeliveryStatus) => Promise<void>;
}>;

type DispatchStore = Pick<
  WhatsAppAutomationStore,
  "claimDueWhatsAppMessages" | "completeWhatsAppMessageDelivery"
>;

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

async function digestSha256(value: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    toArrayBuffer(textEncoder.encode(value)),
  );
  return bytesToHex(new Uint8Array(digest));
}

function configuredIdentifier(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && /^\d{5,30}$/.test(normalized) ? normalized : null;
}

function configuredTemplate(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && /^[a-z0-9_]{1,512}$/.test(normalized) ? normalized : null;
}

function configuredSiteOrigin(value: string | undefined) {
  try {
    const url = new URL(value?.trim() ?? "");
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function readWhatsAppConfig(environment: WhatsAppEnvironment): WhatsAppConfig | null {
  const accessToken = environment.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = configuredIdentifier(environment.WHATSAPP_PHONE_NUMBER_ID);
  const businessAccountId = configuredIdentifier(environment.WHATSAPP_BUSINESS_ACCOUNT_ID);
  const bookingConfirmationTemplate = configuredTemplate(
    environment.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE,
  );
  const appointmentReminderTemplate = configuredTemplate(
    environment.WHATSAPP_APPOINTMENT_REMINDER_1H_TEMPLATE,
  );
  const templateLanguage = environment.WHATSAPP_TEMPLATE_LANGUAGE?.trim();
  const dispatcherSecret = environment.WHATSAPP_DISPATCHER_SECRET?.trim();
  const siteOrigin = configuredSiteOrigin(environment.SITE_URL);
  if (
    !accessToken
    || !phoneNumberId
    || !businessAccountId
    || !bookingConfirmationTemplate
    || !appointmentReminderTemplate
    || !templateLanguage
    || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(templateLanguage)
    || !dispatcherSecret
    || dispatcherSecret.length < 32
    || !siteOrigin
  ) return null;
  return {
    accessToken,
    phoneNumberId,
    businessAccountId,
    bookingConfirmationTemplate,
    appointmentReminderTemplate,
    templateLanguage,
    dispatcherSecret,
    siteOrigin,
  };
}

function appointmentParts(startsAt: string) {
  const date = new Date(startsAt);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid appointment time");
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date),
  };
}

function namedText(parameterName: string, text: string) {
  return { type: "text", parameter_name: parameterName, text };
}

export function buildWhatsAppTemplatePayload(
  job: WhatsAppOutboundJob,
  environment: WhatsAppEnvironment | WhatsAppConfig,
) {
  const config = "accessToken" in environment
    ? environment
    : readWhatsAppConfig(environment);
  if (!config) throw new Error("WhatsApp automation is not configured");
  const appointment = appointmentParts(job.startsAt);
  const parameters = job.kind === "booking_confirmation"
    ? [
      namedText("customer_name", job.customerFirstName),
      namedText("consultation_name", job.consultationName),
      namedText("appointment_date", appointment.date),
      namedText("appointment_time", appointment.time),
      namedText("meeting_link", job.meetingUrl),
    ]
    : [
      namedText("customer_name", job.customerFirstName),
      namedText("consultation_name", job.consultationName),
      namedText("appointment_time", appointment.time),
      namedText("meeting_link", job.meetingUrl),
    ];
  return {
    messaging_product: "whatsapp",
    to: job.recipientE164.slice(1),
    type: "template",
    template: {
      name: job.kind === "booking_confirmation"
        ? config.bookingConfirmationTemplate
        : config.appointmentReminderTemplate,
      language: { code: config.templateLanguage },
      components: [{ type: "body", parameters }],
    },
  };
}

class DefinitiveMetaError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(`Meta rejected the message with status ${status}`);
  }
}

async function readMetaErrorCode(response: Response) {
  try {
    const body = await response.json() as { error?: { code?: unknown } };
    return typeof body.error?.code === "number" || typeof body.error?.code === "string"
      ? String(body.error.code).slice(0, 80)
      : `http-${response.status}`;
  } catch {
    return `http-${response.status}`;
  }
}

async function sendMetaPayload(
  payload: WhatsAppPayload,
  config: WhatsAppConfig,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new DefinitiveMetaError(response.status, await readMetaErrorCode(response));
  }
  const body = await response.json() as { messages?: Array<{ id?: unknown }> };
  const providerId = body.messages?.[0]?.id;
  if (typeof providerId !== "string" || !providerId) {
    throw new Error("Meta returned an ambiguous success response");
  }
  return digestSha256(providerId);
}

function dispatchJson(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" },
  });
}

export function createWhatsAppDispatchHandler({
  environment,
  store,
  fetchImpl = fetch,
}: {
  environment: WhatsAppEnvironment;
  store?: DispatchStore | null;
  fetchImpl?: typeof fetch;
}) {
  const config = readWhatsAppConfig(environment);
  return async (request: Request) => {
    if (request.method !== "POST") {
      return dispatchJson(405, { error: "Method not allowed." });
    }
    if (!config || !store) {
      return dispatchJson(503, { error: "WhatsApp dispatcher is not configured." });
    }
    const authorization = request.headers.get("authorization") ?? "";
    const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!supplied || !constantTimeTextEqual(supplied, config.dispatcherSecret)) {
      return dispatchJson(401, { error: "Unauthorized." });
    }

    let jobs: WhatsAppOutboundJob[];
    try {
      jobs = await store.claimDueWhatsAppMessages(10);
    } catch {
      return dispatchJson(503, { error: "WhatsApp outbox is temporarily unavailable." });
    }
    const result = { claimed: jobs.length, sent: 0, retryable: 0, ambiguous: 0 };
    for (const job of jobs) {
      try {
        const providerHash = await sendMetaPayload(
          buildWhatsAppTemplatePayload(job, config),
          config,
          fetchImpl,
        );
        await store.completeWhatsAppMessageDelivery(job.id, "sent", providerHash);
        result.sent += 1;
      } catch (error) {
        if (error instanceof DefinitiveMetaError) {
          await store.completeWhatsAppMessageDelivery(job.id, "retry", undefined, error.code);
          result.retryable += 1;
        } else {
          await store.completeWhatsAppMessageDelivery(job.id, "ambiguous", undefined, "delivery-ambiguous");
          result.ambiguous += 1;
        }
      }
    }
    return dispatchJson(result.retryable || result.ambiguous ? 503 : 200, result);
  };
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

type InboundAction = "book" | "manage" | "information" | "human" | "menu";

type InboundMessage = Readonly<{
  providerId: string;
  recipientE164: string;
  action: InboundAction;
}>;

function normalizeInboundRecipient(value: unknown) {
  if (typeof value !== "string") return null;
  const digits = value.replace(/^\+/, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

function normalizedAction(value: unknown): InboundAction {
  if (typeof value !== "string") return "menu";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (["book", "book a consultation", "1"].includes(normalized)) return "book";
  if (["manage", "manage booking", "2"].includes(normalized)) return "manage";
  if (["information", "consultation information", "consultations", "info", "3"].includes(normalized)) {
    return "information";
  }
  if (["human", "human help", "help", "4"].includes(normalized)) return "human";
  return "menu";
}

function messageAction(message: Record<string, unknown>) {
  const interactive = isObject(message.interactive) ? message.interactive : {};
  const listReply = isObject(interactive.list_reply) ? interactive.list_reply : {};
  const buttonReply = isObject(interactive.button_reply) ? interactive.button_reply : {};
  const button = isObject(message.button) ? message.button : {};
  const text = isObject(message.text) ? message.text : {};
  return normalizedAction(listReply.id ?? buttonReply.id ?? button.payload ?? text.body);
}

function extractInboundMessages(
  parsed: unknown,
  expectedBusinessAccountId: string,
  expectedPhoneNumberId: string,
) {
  if (!isObject(parsed) || parsed.object !== "whatsapp_business_account" || !Array.isArray(parsed.entry)) {
    return [];
  }
  const messages: InboundMessage[] = [];
  for (const entry of parsed.entry) {
    if (!isObject(entry) || entry.id !== expectedBusinessAccountId || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isObject(change) || change.field !== "messages" || !isObject(change.value)) continue;
      const metadata = isObject(change.value.metadata) ? change.value.metadata : {};
      if (metadata.phone_number_id !== expectedPhoneNumberId || !Array.isArray(change.value.messages)) continue;
      for (const rawMessage of change.value.messages) {
        if (!isObject(rawMessage) || typeof rawMessage.id !== "string") continue;
        const recipientE164 = normalizeInboundRecipient(rawMessage.from);
        if (!recipientE164) continue;
        messages.push({
          providerId: rawMessage.id,
          recipientE164,
          action: messageAction(rawMessage),
        });
      }
    }
  }
  return messages;
}

function extractDeliveryStatuses(
  parsed: unknown,
  expectedBusinessAccountId: string,
  expectedPhoneNumberId: string,
) {
  if (!isObject(parsed) || parsed.object !== "whatsapp_business_account" || !Array.isArray(parsed.entry)) {
    return [];
  }
  const deliveryStatuses: WhatsAppDeliveryStatus[] = [];
  for (const entry of parsed.entry) {
    if (!isObject(entry) || entry.id !== expectedBusinessAccountId || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isObject(change) || change.field !== "messages" || !isObject(change.value)) continue;
      const metadata = isObject(change.value.metadata) ? change.value.metadata : {};
      if (metadata.phone_number_id !== expectedPhoneNumberId || !Array.isArray(change.value.statuses)) continue;
      for (const rawStatus of change.value.statuses) {
        if (!isObject(rawStatus) || typeof rawStatus.status !== "string") continue;
        const status = rawStatus.status.trim().toLowerCase();
        if (!/^[a-z_]{1,32}$/.test(status)) continue;
        const errorCodes = Array.isArray(rawStatus.errors)
          ? rawStatus.errors.flatMap((rawError) => {
            if (!isObject(rawError)) return [];
            const code = rawError.code;
            if (typeof code !== "string" && typeof code !== "number") return [];
            const normalized = String(code).trim();
            return /^[a-zA-Z0-9_-]{1,80}$/.test(normalized) ? [normalized] : [];
          })
          : [];
        deliveryStatuses.push({ status, errorCodes: [...new Set(errorCodes)] });
      }
    }
  }
  return deliveryStatuses;
}

function menuPayload() {
  return {
    messaging_product: "whatsapp",
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "How can we help with your consultation?" },
      action: {
        button: "Choose an option",
        sections: [{
          title: "Nakshatra",
          rows: [
            { id: "book", title: "Book a consultation" },
            { id: "manage", title: "Manage booking" },
            { id: "information", title: "Consultation information" },
            { id: "human", title: "Human help" },
          ],
        }],
      },
    },
  };
}

function textPayload(body: string) {
  return {
    messaging_product: "whatsapp",
    type: "text",
    text: { body, preview_url: true },
  };
}

function actionPayload(action: InboundAction, siteOrigin: string) {
  if (action === "book") {
    return textPayload(`Choose a reading and an available time here: ${siteOrigin}/book/`);
  }
  if (action === "manage") {
    return textPayload(
      `Use the manage-booking link in your confirmation email. More guidance: ${siteOrigin}/#booking-policies`,
    );
  }
  if (action === "information") {
    return textPayload(`See the consultation options and what each reading covers: ${siteOrigin}/#consultation`);
  }
  if (action === "human") {
    return textPayload("Nilima has been notified. She will respond here when she is available.");
  }
  return menuPayload();
}

export function createWhatsAppMessageSender(
  config: WhatsAppConfig,
  fetchImpl: typeof fetch = fetch,
) {
  return async (recipientE164: string, payload: WhatsAppPayload) => {
    const withRecipient = { ...payload, to: recipientE164.slice(1) };
    try {
      await sendMetaPayload(withRecipient, config, fetchImpl);
    } catch (error) {
      if (error instanceof DefinitiveMetaError && payload.type === "interactive") {
        await sendMetaPayload(
          {
            ...textPayload(
              `Choose an option:\n1. Book a consultation\n2. Manage booking\n3. Consultation information\n4. Human help`,
            ),
            to: recipientE164.slice(1),
          },
          config,
          fetchImpl,
        );
        return;
      }
      throw error;
    }
  };
}

async function processInboundMessages(
  parsed: unknown,
  automation: WhatsAppInboundAutomation,
) {
  const messages = extractInboundMessages(
    parsed,
    automation.expectedBusinessAccountId,
    automation.expectedPhoneNumberId,
  );
  for (const message of messages) {
    const eventId = await digestSha256(`whatsapp-inbound\n${message.providerId}`);
    if (!(await automation.store.claimWhatsAppInboundDelivery(eventId))) continue;
    try {
      if (message.action === "human") await automation.notifyHumanHelp();
      await automation.sendMessage(
        message.recipientE164,
        actionPayload(message.action, automation.siteOrigin),
      );
      await automation.store.completeWhatsAppInboundDelivery(eventId, true);
    } catch (error) {
      const code = error instanceof DefinitiveMetaError ? error.code : "delivery-failed";
      await automation.store.completeWhatsAppInboundDelivery(eventId, false, code);
      throw error;
    }
  }
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
  automation,
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
  if (automation) {
    try {
      if (automation.recordDeliveryStatus) {
        for (const deliveryStatus of extractDeliveryStatuses(
          parsed,
          automation.expectedBusinessAccountId,
          automation.expectedPhoneNumberId,
        )) {
          await automation.recordDeliveryStatus(deliveryStatus);
        }
      }
      await processInboundMessages(parsed, automation);
    } catch {
      return jsonResponse(503, { error: "WhatsApp processing is temporarily unavailable." });
    }
  }
  return jsonResponse(200, { received: true });
}
