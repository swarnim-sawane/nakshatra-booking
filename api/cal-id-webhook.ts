import {
  handleCalIdWebhookRequest,
  MAX_WEBHOOK_BODY_BYTES,
  type CalIdEventTypeSlug,
  type CalIdWebhookNotifier,
  type CalIdWebhookStore,
} from "../src/server/calIdWebhook.js";
import { createNeonAdminStore } from "../src/server/neonAdminStore.js";
import {
  readLimitedBody,
  RequestBodyTooLargeError,
} from "../src/server/adminHttp.js";
import { DurablePushNotifier, readVapidConfig } from "../src/server/webPush.js";

declare const process: { env: Record<string, string | undefined> };

type WebhookHandlerOptions = {
  environment?: Record<string, string | undefined>;
  store?: CalIdWebhookStore | null;
  notifier?: CalIdWebhookNotifier;
  eventTypeIdMap?: ReadonlyMap<number, CalIdEventTypeSlug>;
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

export async function readWebhookBody(
  request: Request,
  maximumBytes = MAX_WEBHOOK_BODY_BYTES,
) {
  return readLimitedBody(request, maximumBytes);
}

function readEventTypeIdMap(environment: Record<string, string | undefined>) {
  const values = [
    [environment.CALID_PERSONAL_EVENT_TYPE_ID ?? "108657", "personal-consultation"],
    [environment.CALID_RELATIONSHIP_EVENT_TYPE_ID ?? "108655", "relationship-consultation"],
    [environment.CALID_MUHURAT_EVENT_TYPE_ID ?? "108656", "best-date-analysis"],
  ] as const;
  const mapping = new Map<number, CalIdEventTypeSlug>();
  for (const [rawId, slug] of values) {
    if (/^\d+$/.test(rawId.trim())) mapping.set(Number(rawId), slug);
  }
  return mapping;
}

export function createCalIdWebhookFetchHandler({
  environment = process.env,
  store,
  notifier,
  eventTypeIdMap = readEventTypeIdMap(environment),
  fetchImpl = fetch,
}: WebhookHandlerOptions = {}) {
  const configuredStore = createNeonAdminStore(environment);
  const durableStore = store === undefined ? configuredStore : store;
  const vapid = readVapidConfig(environment);
  const durableNotifier = notifier ?? (
    store === undefined && configuredStore && vapid
      ? new DurablePushNotifier(configuredStore, vapid, fetchImpl)
      : store === undefined && configuredStore
        ? { notify: async () => { throw new Error("Push notifications are not configured"); } }
        : undefined
  );

  return async function handleWebhook(request: Request) {
    let rawBody = new Uint8Array();
    if (request.method === "POST") {
      try {
        rawBody = await readWebhookBody(request);
      } catch (error) {
        return error instanceof RequestBodyTooLargeError
          ? bodyErrorResponse(413, "Webhook body is too large.")
          : bodyErrorResponse(400, "Webhook body could not be read.");
      }
    }
    const result = await handleCalIdWebhookRequest({
      method: request.method,
      rawBody,
      signature: request.headers.get("x-cal-signature-256"),
      secret: environment.CALID_WEBHOOK_SECRET,
      store: durableStore ?? undefined,
      notifier: durableNotifier,
      eventTypeIdMap,
    });
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: result.headers,
    });
  };
}

export default { fetch: createCalIdWebhookFetchHandler() };
