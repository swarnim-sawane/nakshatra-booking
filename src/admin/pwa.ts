import { AdminApiError } from "./api";

export type NotificationRequestResult = NotificationPermission | "unsupported";
export type PushActionResult = "enabled" | "disabled" | "sent" | "unsupported" | "denied";

export async function registerAdminServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" });
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationRequestResult> {
  if (
    typeof Notification === "undefined" ||
    typeof Notification.requestPermission !== "function"
  ) {
    return "unsupported";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

function applicationServerKey(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function pushRequest(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(path, { credentials: "same-origin", ...init });
  } catch {
    throw new AdminApiError("offline", "The notification service could not be reached.");
  }
  if (response.status === 401) {
    throw new AdminApiError("unauthorized", "Your admin session has expired.");
  }
  if (!response.ok) {
    throw new AdminApiError("unavailable", "The notification service is temporarily unavailable.");
  }
  return response;
}

export async function getPushSubscription(
  registration: ServiceWorkerRegistration | null,
) {
  if (!registration || !("pushManager" in registration)) return null;
  return registration.pushManager.getSubscription();
}

export async function enablePushNotifications(
  registration: ServiceWorkerRegistration | null,
): Promise<PushActionResult> {
  if (!registration || !("pushManager" in registration) || typeof Notification === "undefined") {
    return "unsupported";
  }
  let permission: NotificationPermission | "unsupported" = Notification.permission;
  if (permission !== "granted") permission = await requestNotificationPermission();
  if (permission === "unsupported") return "unsupported";
  if (permission !== "granted") return "denied";

  const configResponse = await pushRequest("/api/admin/push-subscription");
  const config = (await configResponse.json()) as { publicKey?: unknown };
  if (typeof config.publicKey !== "string") {
    throw new AdminApiError("invalid", "The notification configuration was invalid.");
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey(config.publicKey),
  });
  await pushRequest("/api/admin/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  return "enabled";
}

export async function disablePushNotifications(
  registration: ServiceWorkerRegistration | null,
): Promise<PushActionResult> {
  const subscription = await getPushSubscription(registration);
  if (!subscription) return "disabled";
  await pushRequest("/api/admin/push-subscription", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
  return "disabled";
}

export async function refreshPushSubscription(
  registration: ServiceWorkerRegistration | null,
): Promise<PushActionResult> {
  const subscription = await getPushSubscription(registration);
  if (!subscription) return "disabled";
  const response = await pushRequest("/api/admin/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...subscription.toJSON(), renewal: true }),
  });
  const result = (await response.json()) as { enabled?: unknown };
  return result.enabled === true ? "enabled" : "disabled";
}

export async function revokeAllPushNotifications(
  registration: ServiceWorkerRegistration | null,
): Promise<PushActionResult> {
  const subscription = await getPushSubscription(registration);
  await pushRequest("/api/admin/push-subscription", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  });
  if (subscription) await subscription.unsubscribe();
  return "disabled";
}

export async function sendTestNotification(
  registration: ServiceWorkerRegistration | null,
): Promise<PushActionResult> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "granted") return "denied";
  const subscription = await getPushSubscription(registration);
  if (!subscription) return "unsupported";
  await pushRequest("/api/admin/test-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  return "sent";
}
