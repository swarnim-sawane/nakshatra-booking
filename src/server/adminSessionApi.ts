import {
  authenticateAdminRequest,
  clearAdminSessionCookie,
  createAdminRateLimitSourceKey,
  createAdminSessionCookie,
  createAdminSessionToken,
  isAdminAuthConfigured,
  isSameOriginMutation,
  verifyAdminCredentials,
  type AdminAuthEnvironment,
} from "./adminAuth";
import { emptyResponse, isRecord, jsonResponse, readLimitedJson } from "./adminHttp";

type AdminSessionHandlerOptions = {
  environment: AdminAuthEnvironment;
  rateLimiter?: AdminLoginRateLimiter | null;
  verifyCredentials?: typeof verifyAdminCredentials;
  now?: () => Date;
};

type AdminLoginRateLimiter = {
  consumeAdminLoginAttempt(sourceKey: string): Promise<{
    allowed: boolean;
    retryAfterSeconds: number;
  }>;
};

export function createAdminSessionHandler({
  environment,
  rateLimiter = null,
  verifyCredentials = verifyAdminCredentials,
  now = () => new Date(),
}: AdminSessionHandlerOptions) {
  return async function handleAdminSession(request: Request) {
    if (!isAdminAuthConfigured(environment)) {
      return jsonResponse(503, { error: "Admin sign-in is not configured." });
    }

    if (request.method === "GET") {
      const auth = await authenticateAdminRequest(request, environment, now());
      return auth === "authenticated"
        ? jsonResponse(200, { authenticated: true })
        : jsonResponse(401, { authenticated: false });
    }

    if (request.method === "DELETE") {
      if (!isSameOriginMutation(request)) {
        return jsonResponse(403, { error: "Request origin is not allowed." });
      }
      return emptyResponse(204, { "Set-Cookie": clearAdminSessionCookie() });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed." }, { Allow: "GET, POST, DELETE" });
    }
    if (!isSameOriginMutation(request)) {
      return jsonResponse(403, { error: "Request origin is not allowed." });
    }

    let body: unknown;
    try {
      body = await readLimitedJson(request);
    } catch {
      return jsonResponse(400, { error: "Invalid sign-in request." });
    }
    if (!isRecord(body) || typeof body.username !== "string" || typeof body.password !== "string") {
      return jsonResponse(400, { error: "Invalid sign-in request." });
    }

    const rateLimitSecret = environment.ADMIN_RATE_LIMIT_SECRET?.trim() ?? "";
    if (!rateLimiter || rateLimitSecret.length < 32) {
      return jsonResponse(503, { error: "Sign-in temporarily unavailable." });
    }

    let limit: { allowed: boolean; retryAfterSeconds: number };
    try {
      const sourceKey = await createAdminRateLimitSourceKey(request, rateLimitSecret);
      limit = await rateLimiter.consumeAdminLoginAttempt(sourceKey);
    } catch {
      return jsonResponse(503, { error: "Sign-in temporarily unavailable." });
    }
    if (!limit.allowed) {
      const retryAfter = Number.isInteger(limit.retryAfterSeconds)
        ? Math.min(3_600, Math.max(1, limit.retryAfterSeconds))
        : 900;
      return jsonResponse(
        429,
        { error: "Sign-in temporarily unavailable." },
        { "Retry-After": String(retryAfter) },
      );
    }

    const valid = await verifyCredentials(body.username, body.password, environment);
    if (!valid) return jsonResponse(401, { error: "Sign-in failed." });

    const username = environment.ADMIN_USERNAME!.trim();
    const token = await createAdminSessionToken(
      username,
      environment.ADMIN_SESSION_SECRET!,
      now(),
    );
    return jsonResponse(
      200,
      { authenticated: true },
      { "Set-Cookie": createAdminSessionCookie(token) },
    );
  };
}
