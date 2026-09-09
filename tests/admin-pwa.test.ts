// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  disablePushNotifications,
  enablePushNotifications,
  registerAdminServiceWorker,
  requestNotificationPermission,
  sendTestNotification,
} from "../src/admin/pwa";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function subscription() {
  return {
    endpoint: "https://push.example.test/opaque",
    toJSON: () => ({
      endpoint: "https://push.example.test/opaque",
      expirationTime: null,
      keys: { p256dh: "public-key", auth: "auth-key" },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as unknown as PushSubscription;
}

describe("admin PWA notifications", () => {
  it("reports unsupported notification APIs", async () => {
    vi.stubGlobal("Notification", undefined);
    expect(await requestNotificationPermission()).toBe("unsupported");
  });

  it("registers and persists a browser PushManager subscription", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    const created = subscription();
    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(created),
    };
    const publicKey = btoa(String.fromCharCode(...new Uint8Array(65).fill(1)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ enabled: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await enablePushNotifications({ pushManager } as unknown as ServiceWorkerRegistration)).toBe("enabled");
    expect(pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/admin/push-subscription",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });

  it("disables the durable record before unsubscribing locally", async () => {
    const active = subscription();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ enabled: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const registration = { pushManager: { getSubscription: vi.fn().mockResolvedValue(active) } } as unknown as ServiceWorkerRegistration;

    expect(await disablePushNotifications(registration)).toBe("disabled");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/push-subscription", expect.objectContaining({ method: "DELETE" }));
    expect(active.unsubscribe).toHaveBeenCalled();
  });

  it("routes a test alert through the protected server endpoint", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    const active = subscription();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sent: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const registration = { pushManager: { getSubscription: vi.fn().mockResolvedValue(active) } } as unknown as ServiceWorkerRegistration;

    expect(await sendTestNotification(registration)).toBe("sent");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/test-notification", expect.objectContaining({ method: "POST" }));
  });

  it("does not throw when service-worker registration fails", async () => {
    const register = vi.fn().mockRejectedValue(new Error("blocked"));
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    expect(await registerAdminServiceWorker()).toBeNull();
  });
});
