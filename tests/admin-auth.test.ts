import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdminRequest,
  createAdminPasswordHash,
  createAdminSessionToken,
  verifyAdminCredentials,
} from "../src/server/adminAuth";
import { createAdminSessionHandler } from "../src/server/adminSessionApi";

const password = "owner-password-123!";
const now = new Date("2026-09-09T12:00:00.000Z");

async function environment() {
  return {
    ADMIN_USERNAME: "nilima",
    ADMIN_PASSWORD_HASH: await createAdminPasswordHash(password, 100_000, new Uint8Array(16).fill(7)),
    ADMIN_SESSION_SECRET: "s".repeat(48),
    ADMIN_RATE_LIMIT_SECRET: "r".repeat(48),
  };
}

function allowingRateLimiter() {
  return {
    consumeAdminLoginAttempt: vi.fn().mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    }),
  };
}

describe("single-owner admin authentication", () => {
  it("verifies the environment hash without exposing a browser secret", async () => {
    const env = await environment();
    expect(await verifyAdminCredentials("nilima", password, env)).toBe(true);
    expect(await verifyAdminCredentials("nilima", "wrong-password", env)).toBe(false);
    expect(JSON.stringify(env)).not.toContain(password);
  });

  it("issues a Secure HttpOnly SameSite=Strict cookie", async () => {
    const env = await environment();
    const handler = createAdminSessionHandler({
      environment: env,
      rateLimiter: allowingRateLimiter(),
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://nilima.example" },
      body: JSON.stringify({ username: "nilima", password }),
    }));
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
  });

  it("rejects cross-origin sign-in and expired sessions", async () => {
    const env = await environment();
    const handler = createAdminSessionHandler({
      environment: env,
      rateLimiter: allowingRateLimiter(),
      now: () => now,
    });
    const crossOrigin = await handler(new Request("https://nilima.example/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://attacker.example" },
      body: JSON.stringify({ username: "nilima", password }),
    }));
    expect(crossOrigin.status).toBe(403);

    const token = await createAdminSessionToken("nilima", env.ADMIN_SESSION_SECRET, new Date("2026-09-08T00:00:00.000Z"), 60);
    const auth = await authenticateAdminRequest(
      new Request("https://nilima.example/api/admin/bookings", {
        headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
      }),
      env,
      now,
    );
    expect(auth).toBe("unauthorized");
  });

  it("fails closed when auth configuration is incomplete", async () => {
    const handler = createAdminSessionHandler({ environment: {} });
    const response = await handler(new Request("https://nilima.example/api/admin/session"));
    expect(response.status).toBe(503);
  });

  it("rate limits by an HMAC source key before password verification", async () => {
    const env = await environment();
    const consumeAdminLoginAttempt = vi.fn().mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 43,
    });
    const verifyCredentials = vi.fn().mockResolvedValue(true);
    const handler = createAdminSessionHandler({
      environment: env,
      rateLimiter: { consumeAdminLoginAttempt },
      verifyCredentials,
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://nilima.example",
        "x-forwarded-for": "203.0.113.42, 10.0.0.1",
      },
      body: JSON.stringify({ username: "nilima", password }),
    }));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("43");
    expect(await response.json()).toEqual({ error: "Sign-in temporarily unavailable." });
    expect(verifyCredentials).not.toHaveBeenCalled();
    expect(consumeAdminLoginAttempt).toHaveBeenCalledTimes(1);
    const sourceKey = consumeAdminLoginAttempt.mock.calls[0][0];
    expect(sourceKey).toMatch(/^[a-f0-9]{64}$/);
    expect(sourceKey).not.toContain("203.0.113.42");
  });

  it("fails closed before password verification when the durable limiter is unavailable", async () => {
    const env = await environment();
    const verifyCredentials = vi.fn().mockResolvedValue(true);
    const handler = createAdminSessionHandler({
      environment: env,
      rateLimiter: {
        consumeAdminLoginAttempt: vi.fn().mockRejectedValue(new Error("database unavailable")),
      },
      verifyCredentials,
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://nilima.example",
        "x-real-ip": "198.51.100.8",
      },
      body: JSON.stringify({ username: "nilima", password }),
    }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Sign-in temporarily unavailable." });
    expect(verifyCredentials).not.toHaveBeenCalled();
  });

  it("stops reading oversized streamed credentials before the limiter or PBKDF2", async () => {
    const env = await environment();
    const consumeAdminLoginAttempt = vi.fn();
    const verifyCredentials = vi.fn();
    let pullCount = 0;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pullCount += 1;
        if (pullCount <= 3) controller.enqueue(new Uint8Array(4 * 1_024));
        else controller.close();
      },
      cancel() {
        cancelled = true;
      },
    });
    const handler = createAdminSessionHandler({
      environment: env,
      rateLimiter: { consumeAdminLoginAttempt },
      verifyCredentials,
      now: () => now,
    });
    const response = await handler(new Request("https://nilima.example/api/admin/session", {
      method: "POST",
      headers: { origin: "https://nilima.example" },
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" }));

    expect(response.status).toBe(400);
    expect(cancelled).toBe(true);
    expect(consumeAdminLoginAttempt).not.toHaveBeenCalled();
    expect(verifyCredentials).not.toHaveBeenCalled();
  });
});
