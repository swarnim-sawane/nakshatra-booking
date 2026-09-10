import {
  handleWhatsAppWebhookRequest,
  MAX_WHATSAPP_WEBHOOK_BODY_BYTES,
} from "../src/server/whatsAppWebhook.js";
import {
  readLimitedBody,
  RequestBodyTooLargeError,
} from "../src/server/adminHttp.js";

declare const process: { env: Record<string, string | undefined> };

type WhatsAppWebhookHandlerOptions = {
  environment?: Record<string, string | undefined>;
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
}: WhatsAppWebhookHandlerOptions = {}) {
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
