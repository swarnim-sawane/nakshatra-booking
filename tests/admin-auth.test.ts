import { describe, expect, it } from "vitest";
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
    const handler = createAdminSessionHandler({ environment: env, now: () => now });
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
    const handler = createAdminSessionHandler({ environment: env, now: () => now });
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
});
