import {
  createWhatsAppMessageSender,
  handleWhatsAppWebhookRequest,
  MAX_WHATSAPP_WEBHOOK_BODY_BYTES,
  readWhatsAppConfig,
  type WhatsAppInboundAutomation,
} from "../src/server/whatsAppWebhook.js";
import {
  readLimitedBody,
  RequestBodyTooLargeError,
} from "../src/server/adminHttp.js";
import { createNeonAdminStore, type NeonAdminStore } from "../src/server/neonAdminStore.js";
import { notifyAdminHumanHelp, readVapidConfig } from "../src/server/webPush.js";

declare const process: { env: Record<string, string | undefined> };

type WhatsAppWebhookHandlerOptions = {
  environment?: Record<string, string | undefined>;
  store?: NeonAdminStore | null;
  automation?: WhatsAppInboundAutomation;
  fetchImpl?: typeof fetch;
};

function bodyErrorResponse(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function createWhatsAppWebhookFetchHandler({
  environment = process.env,
  store,
  automation,
  fetchImpl = fetch,
}: WhatsAppWebhookHandlerOptions = {}) {
  const configuredStore = store === undefined ? createNeonAdminStore(environment) : store;
  const config = readWhatsAppConfig(environment);
  const vapid = readVapidConfig(environment);
  const recordDeliveryStatus = async (deliveryStatus: { status: string; errorCodes: string[] }) => {
    console.info(JSON.stringify({
      event: "whatsapp_delivery_status",
      status: deliveryStatus.status,
      errorCodes: deliveryStatus.errorCodes,
    }));
  };
  const configuredAutomation = automation ?? (
    config && configuredStore && vapid
      ? {
        expectedBusinessAccountId: config.businessAccountId,
        expectedPhoneNumberId: config.phoneNumberId,
        siteOrigin: config.siteOrigin,
        store: configuredStore,
        sendMessage: createWhatsAppMessageSender(config, fetchImpl),
        notifyHumanHelp: () => notifyAdminHumanHelp(configuredStore, vapid, fetchImpl),
        recordDeliveryStatus,
      }
      : config
        ? {
          expectedBusinessAccountId: config.businessAccountId,
          expectedPhoneNumberId: config.phoneNumberId,
          siteOrigin: config.siteOrigin,
          store: {
            claimWhatsAppInboundDelivery: async () => { throw new Error("storage unavailable"); },
            completeWhatsAppInboundDelivery: async () => undefined,
          },
          sendMessage: async () => { throw new Error("delivery unavailable"); },
          notifyHumanHelp: async () => { throw new Error("notification unavailable"); },
          recordDeliveryStatus,
        }
        : undefined
  );
  return async function handleWebhook(request: Request) {
    let rawBody = new Uint8Array();
    if (request.method === "POST") {
      try {
        rawBody = await readLimitedBody(request, MAX_WHATSAPP_WEBHOOK_BODY_BYTES);
      } catch (error) {
        return error instanceof RequestBodyTooLargeError
          ? bodyErrorResponse(413, "Webhook body is too large.")
          : bodyErrorResponse(400, "Webhook body could not be read.");
      }
    }

    const result = await handleWhatsAppWebhookRequest({
      method: request.method,
      url: request.url,
      rawBody,
      signature: request.headers.get("x-hub-signature-256"),
      verifyToken: environment.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      appSecret: environment.META_APP_SECRET,
      automation: configuredAutomation,
    });
    return new Response(
      typeof result.body === "string" ? result.body : JSON.stringify(result.body),
      {
        status: result.status,
        headers: result.headers,
      },
    );
  };
}

export default { fetch: createWhatsAppWebhookFetchHandler() };
