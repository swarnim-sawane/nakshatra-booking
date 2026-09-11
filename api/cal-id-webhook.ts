import {
  handleCalIdWebhookRequest,
  type CalIdEventTypeSlug,
  type CalIdWebhookStore,
} from "../src/server/calIdWebhook.js";

declare const process: {
  env: Record<string, string | undefined>;
};

type WebhookHandlerOptions = {
  secret?: string;
  store?: CalIdWebhookStore;
  eventTypeIdMap?: ReadonlyMap<number, CalIdEventTypeSlug>;
};

function readEventTypeIdMap(environment: Record<string, string | undefined>) {
  const values = [
    ["CALID_PERSONAL_EVENT_TYPE_ID", "personal-consultation"],
    ["CALID_RELATIONSHIP_EVENT_TYPE_ID", "relationship-consultation"],
    ["CALID_MUHURAT_EVENT_TYPE_ID", "best-date-analysis"],
  ] as const;
  const mapping = new Map<number, CalIdEventTypeSlug>();

  for (const [key, slug] of values) {
    const value = environment[key]?.trim();
    if (!value || !/^\d+$/.test(value)) continue;
    mapping.set(Number(value), slug);
  }
  return mapping;
}

export function createCalIdWebhookFetchHandler({
  secret = process.env.CALID_WEBHOOK_SECRET,
  store,
  eventTypeIdMap = readEventTypeIdMap(process.env),
}: WebhookHandlerOptions = {}) {
  return async function fetch(request: Request) {
    const rawBody =
      request.method === "POST"
        ? new Uint8Array(await request.arrayBuffer())
        : new Uint8Array();
    const result = await handleCalIdWebhookRequest({
      method: request.method,
      rawBody,
      signature: request.headers.get("x-cal-signature-256"),
      secret,
      store,
      eventTypeIdMap,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: result.headers,
    });
  };
}

// Deliberately fail closed until a durable CalIdWebhookStore is selected and
// injected. Do not replace this with process memory on Vercel.
export default {
  fetch: createCalIdWebhookFetchHandler(),
};
