export function jsonResponse(status: number, body: unknown, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Cookie",
      ...headers,
    },
  });
}

export function emptyResponse(status: number, headers: HeadersInit = {}) {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Vary": "Cookie",
      ...headers,
    },
  });
}

export async function readLimitedJson(request: Request, maximumBytes = 8 * 1_024) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw new Error("Request body is too large");
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximumBytes) {
    throw new Error("Request body is too large");
  }
  return JSON.parse(body) as unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
