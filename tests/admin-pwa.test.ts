// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  registerAdminServiceWorker,
  requestNotificationPermission,
  sendTestNotification,
} from "../src/admin/pwa";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin PWA notifications", () => {
  it("reports unsupported notification APIs", async () => {
    vi.stubGlobal("Notification", undefined);

    expect(await requestNotificationPermission()).toBe("unsupported");
  });

  it("sends the sample alert through the admin service worker", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    const showNotification = vi.fn().mockResolvedValue(undefined);

    expect(
      await sendTestNotification({
        showNotification,
      } as unknown as ServiceWorkerRegistration),
    ).toBe("sent");
    expect(showNotification).toHaveBeenCalledWith(
      "Nakshatra Admin test",
      expect.objectContaining({
        body: "Sample notifications work on this device. Live booking alerts are not connected yet.",
        tag: "nakshatra-admin-test",
      }),
    );
  });

  it("does not throw when service-worker registration fails", async () => {
    const register = vi.fn().mockRejectedValue(new Error("blocked"));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    expect(await registerAdminServiceWorker()).toBeNull();
    expect(register).toHaveBeenCalledWith("/admin/sw.js", { scope: "/admin/" });
  });

  it("does not send when notification permission is denied", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    const showNotification = vi.fn();

    expect(
      await sendTestNotification({
        showNotification,
      } as unknown as ServiceWorkerRegistration),
    ).toBe("denied");
    expect(showNotification).not.toHaveBeenCalled();
  });
});
