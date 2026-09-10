export const ADMIN_SESSION_COOKIE = "__Host-nakshatra_admin";
export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60;

export type AdminAuthEnvironment = Readonly<{
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  ADMIN_RATE_LIMIT_SECRET?: string;
}>;

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlDecode(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url value");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return new Uint8Array(signature);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizedRequestSource(request: Request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "";
  const candidate = forwarded.split(",", 1)[0]?.trim().toLowerCase() ?? "";
  return (
    candidate.length >= 3 &&
    candidate.length <= 64 &&
    /^[0-9a-f:.]+$/.test(candidate) &&
    (candidate.includes(".") || candidate.includes(":"))
  ) ? candidate : "unknown";
}

export async function createAdminRateLimitSourceKey(request: Request, secret: string) {
  if (secret.length < 32) throw new Error("Admin rate-limit secret is not configured");
  const source = normalizedRequestSource(request);
  return bytesToHex(await hmac(secret, `nakshatra-admin-login-v1:${source}`));
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: toArrayBuffer(salt),
    },
    key,
    256,
  );
  return new Uint8Array(derived);
}

export async function createAdminPasswordHash(
  password: string,
  iterations = 210_000,
  salt = crypto.getRandomValues(new Uint8Array(16)),
) {
  if (password.length < 12) throw new Error("Admin password must contain at least 12 characters");
  if (!Number.isInteger(iterations) || iterations < 100_000) {
    throw new Error("PBKDF2 iterations must be at least 100000");
  }
  const hash = await derivePasswordHash(password, salt, iterations);
  return `pbkdf2_sha256$${iterations}$${base64UrlEncode(salt)}$${base64UrlEncode(hash)}`;
}

export async function verifyAdminPassword(password: string, storedHash: string) {
  const [scheme, rawIterations, rawSalt, rawHash, extra] = storedHash.split("$");
  const iterations = Number(rawIterations);
  if (
    scheme !== "pbkdf2_sha256" ||
    extra !== undefined ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    !rawSalt ||
    !rawHash
  ) {
    return false;
  }

  try {
    const expected = base64UrlDecode(rawHash);
    const actual = await derivePasswordHash(password, base64UrlDecode(rawSalt), iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function isAdminAuthConfigured(environment: AdminAuthEnvironment) {
  return Boolean(
    environment.ADMIN_USERNAME?.trim() &&
      environment.ADMIN_PASSWORD_HASH?.trim() &&
      environment.ADMIN_SESSION_SECRET &&
      environment.ADMIN_SESSION_SECRET.length >= 32,
  );
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
  environment: AdminAuthEnvironment,
) {
  if (!isAdminAuthConfigured(environment)) return false;
  const expectedUsername = environment.ADMIN_USERNAME!.trim();
  const left = encoder.encode(username.trim());
  const right = encoder.encode(expectedUsername);
  const usernameMatches = constantTimeEqual(left, right);
  const passwordMatches = await verifyAdminPassword(
    password,
    environment.ADMIN_PASSWORD_HASH!.trim(),
  );
  return usernameMatches && passwordMatches;
}

export async function createAdminSessionToken(
  username: string,
  secret: string,
  now = new Date(),
  ttlSeconds = ADMIN_SESSION_TTL_SECONDS,
) {
  const issuedAt = Math.floor(now.getTime() / 1_000);
  const payload: SessionPayload = {
    sub: username,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = base64UrlEncode(await hmac(secret, encodedPayload));
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string,
  username: string,
  secret: string,
  now = new Date(),
) {
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra !== undefined) return false;

  try {
    const expected = await hmac(secret, encodedPayload);
    const actual = base64UrlDecode(encodedSignature);
    if (!constantTimeEqual(actual, expected)) return false;
    const parsed = JSON.parse(decoder.decode(base64UrlDecode(encodedPayload))) as Partial<SessionPayload>;
    const currentTime = Math.floor(now.getTime() / 1_000);
    return (
      parsed.sub === username &&
      Number.isInteger(parsed.iat) &&
      Number.isInteger(parsed.exp) &&
      (parsed.iat as number) <= currentTime + 60 &&
      (parsed.exp as number) > currentTime
    );
  } catch {
    return false;
  }
}

export function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const segment of cookieHeader.split(";")) {
    const separator = segment.indexOf("=");
    if (separator < 0) continue;
    if (segment.slice(0, separator).trim() === name) {
      return segment.slice(separator + 1).trim() || null;
    }
  }
  return null;
}

export async function authenticateAdminRequest(
  request: Request,
  environment: AdminAuthEnvironment,
  now = new Date(),
) {
  if (!isAdminAuthConfigured(environment)) return "unconfigured" as const;
  const token = readCookie(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (!token) return "unauthorized" as const;
  const valid = await verifyAdminSessionToken(
    token,
    environment.ADMIN_USERNAME!.trim(),
    environment.ADMIN_SESSION_SECRET!,
    now,
  );
  return valid ? ("authenticated" as const) : ("unauthorized" as const);
}

export function createAdminSessionCookie(token: string, maxAge = ADMIN_SESSION_TTL_SECONDS) {
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearAdminSessionCookie() {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
