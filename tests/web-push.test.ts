import { describe, expect, it, vi } from "vitest";
import { base64UrlEncode } from "../src/server/adminAuth";
import {
  privacySafeNotification,
  readVapidConfig,
  sendWebPush,
} from "../src/server/webPush";

async function testVapidConfig() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const publicKey = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return {
    publicKey: base64UrlEncode(publicKey),
    privateKey: privateJwk.d!,
    subject: "mailto:owner@example.com",
  };
}

async function testSubscription() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  return {
    endpoint: "https://push.example.test/send/opaque-subscription",
    expirationTime: null,
    keys: {
      p256dh: base64UrlEncode(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))),
      auth: base64UrlEncode(new Uint8Array(16).fill(9)),
    },
  };
}

describe("privacy-safe Web Push", () => {
  it("uses lifecycle-only lock-screen copy", () => {
    expect(privacySafeNotification("BOOKING_CREATED")).toEqual(expect.objectContaining({
      title: "New consultation booked",
      body: "Open Nakshatra Admin for details.",
    }));
    const serialized = JSON.stringify(privacySafeNotification("BOOKING_CANCELLED"));
    expect(serialized).not.toContain("customer");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("phone");
    expect(privacySafeNotification("WHATSAPP_HUMAN_HELP" as never)).toEqual({
      title: "Customer requested help",
      body: "Open Nakshatra Admin for details.",
      tag: "nakshatra-customer-help",
    });
  });

  it("validates VAPID key shape and subject", async () => {
    const config = await testVapidConfig();
    const environment = {
      VAPID_PUBLIC_KEY: config.publicKey,
      VAPID_PRIVATE_KEY: config.privateKey,
      VAPID_SUBJECT: config.subject,
    };
    expect(readVapidConfig(environment)).toEqual(config);
    expect(readVapidConfig({ ...environment, VAPID_SUBJECT: "owner@example.com" })).toBeNull();
  });

  it("encrypts the notification and authenticates to the push endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    const result = await sendWebPush(
      await testSubscription(),
      "BOOKING_CREATED",
      await testVapidConfig(),
      fetchImpl,
    );
    expect(result).toBe("sent");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://push.example.test/send/opaque-subscription");
    expect(init.headers.Authorization).toMatch(/^vapid t=.+, k=.+/);
    expect(init.headers["Content-Encoding"]).toBe("aes128gcm");
    expect(new TextDecoder().decode(init.body)).not.toContain("New consultation booked");
  });

  it("removes expired push endpoints through the gone result", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 410 }));
    expect(await sendWebPush(await testSubscription(), "TEST", await testVapidConfig(), fetchImpl)).toBe("gone");
  });
});
