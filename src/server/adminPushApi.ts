import {
  authenticateAdminRequest,
  base64UrlDecode,
  isSameOriginMutation,
  type AdminAuthEnvironment,
} from "./adminAuth";
import { isRecord, jsonResponse, readLimitedJson } from "./adminHttp";
import type {
  AdminDataStore,
  StoredPushSubscription,
} from "./neonAdminStore";
import { sendWebPush, type VapidConfig } from "./webPush";

type PushHandlerOptions = {
  environment: AdminAuthEnvironment;
  store: AdminDataStore | null;
  vapid: VapidConfig | null;
  now?: () => Date;
  fetchImpl?: typeof fetch;
};

function normalizeEndpoint(value: unknown) {
  if (typeof value !== "string" || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeSubscription(value: unknown): StoredPushSubscription | null {
  if (!isRecord(value) || !isRecord(value.keys)) return null;
  const endpoint = normalizeEndpoint(value.endpoint);
  const p256dh = value.keys.p256dh;
  const auth = value.keys.auth;
  const expirationTime = value.expirationTime;
  if (
    !endpoint ||
    typeof p256dh !== "string" ||
    typeof auth !== "string" ||
    (expirationTime !== null && typeof expirationTime !== "number")
  ) {
    return null;
  }
  try {
    if (base64UrlDecode(p256dh).byteLength !== 65 || base64UrlDecode(auth).byteLength < 16) {
      return null;
    }
  } catch {
    return null;
  }
  return { endpoint, expirationTime, keys: { p256dh, auth } };
}

async function authorize(
  request: Request,
  environment: AdminAuthEnvironment,
  now: () => Date,
) {
  const auth = await authenticateAdminRequest(request, environment, now());
  if (auth === "unconfigured") {
    return jsonResponse(503, { error: "Admin sign-in is not configured." });
  }
  if (auth !== "authenticated") {
    return jsonResponse(401, { error: "Your admin session has expired." });
  }
  return null;
}

export function createAdminPushSubscriptionHandler({
  environment,
  store,
  vapid,
  now = () => new Date(),
}: PushHandlerOptions) {
  return async function handleAdminPushSubscription(request: Request) {
    const unauthorized = await authorize(request, environment, now);
    if (unauthorized) return unauthorized;
    if (!store || !vapid) {
      return jsonResponse(503, { error: "Push notifications are not configured." });
    }

    if (request.method === "GET") {
      return jsonResponse(200, { publicKey: vapid.publicKey });
    }
    if (request.method !== "POST" && request.method !== "DELETE") {
      return jsonResponse(405, { error: "Method not allowed." }, { Allow: "GET, POST, DELETE" });
    }
    if (!isSameOriginMutation(request)) {
      return jsonResponse(403, { error: "Request origin is not allowed." });
    }

    let body: unknown;
    try {
      body = await readLimitedJson(request, 16 * 1_024);
    } catch {
      return jsonResponse(400, { error: "Invalid push subscription." });
    }

    if (request.method === "POST") {
      const subscription = normalizeSubscription(body);
      if (!subscription) return jsonResponse(400, { error: "Invalid push subscription." });
      try {
        await store.savePushSubscription(subscription);
        return jsonResponse(200, { enabled: true });
      } catch {
        return jsonResponse(503, { error: "Could not save this notification subscription." });
      }
    }

    const endpoint = isRecord(body) ? normalizeEndpoint(body.endpoint) : null;
    if (!endpoint) return jsonResponse(400, { error: "Invalid push subscription." });
    try {
      await store.deletePushSubscription(endpoint);
      return jsonResponse(200, { enabled: false });
    } catch {
      return jsonResponse(503, { error: "Could not disable notifications." });
    }
  };
}

export function createAdminTestNotificationHandler({
  environment,
  store,
  vapid,
  now = () => new Date(),
  fetchImpl = fetch,
}: PushHandlerOptions) {
  return async function handleAdminTestNotification(request: Request) {
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed." }, { Allow: "POST" });
    }
    const unauthorized = await authorize(request, environment, now);
    if (unauthorized) return unauthorized;
    if (!isSameOriginMutation(request)) {
      return jsonResponse(403, { error: "Request origin is not allowed." });
    }
    if (!store || !vapid) {
      return jsonResponse(503, { error: "Push notifications are not configured." });
    }

    let body: unknown;
    try {
      body = await readLimitedJson(request);
    } catch {
      return jsonResponse(400, { error: "Invalid notification request." });
    }
    const endpoint = isRecord(body) ? normalizeEndpoint(body.endpoint) : null;
    if (!endpoint) return jsonResponse(400, { error: "Invalid notification request." });

    try {
      const subscription = await store.getPushSubscription(endpoint);
      if (!subscription) return jsonResponse(404, { error: "Notifications are not enabled on this device." });
      const result = await sendWebPush(subscription, "TEST", vapid, fetchImpl);
      if (result === "gone") {
        await store.deletePushSubscription(endpoint);
        return jsonResponse(410, { error: "This notification subscription has expired." });
      }
      return jsonResponse(200, { sent: true });
    } catch {
      return jsonResponse(503, { error: "The test notification could not be sent." });
    }
  };
}
