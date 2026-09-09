export type NotificationRequestResult = NotificationPermission | "unsupported";
export type TestNotificationResult =
  | "sent"
  | "denied"
  | "unsupported"
  | "unavailable";

export async function registerAdminServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/admin/sw.js", {
      scope: "/admin/",
    });
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

export async function sendTestNotification(
  registration: ServiceWorkerRegistration | null,
): Promise<TestNotificationResult> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "granted") return "denied";
  if (!registration || typeof registration.showNotification !== "function") {
    return "unavailable";
  }

  try {
    await registration.showNotification("Nakshatra Admin test", {
      body: "Sample notifications work on this device. Live booking alerts are not connected yet.",
      data: { url: "/admin/" },
      icon: "/brand/icon-192.png",
      tag: "nakshatra-admin-test",
    });
    return "sent";
  } catch {
    return "unavailable";
  }
}
