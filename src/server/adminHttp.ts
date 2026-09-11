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

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readLimitedBody(request: Request, maximumBytes: number) {
  const declaredLength = request.headers.get("content-length")?.trim();
  if (declaredLength && /^\d+$/.test(declaredLength)) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength > maximumBytes) {
      throw new RequestBodyTooLargeError();
    }
  }

  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel("Request body is too large");
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) throw error;
    try {
      await reader.cancel("Request body could not be read");
    } catch {
      // Preserve the original body-read failure.
    }
    throw new Error("Request body could not be read");
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readLimitedJson(request: Request, maximumBytes = 8 * 1_024) {
  const bytes = await readLimitedBody(request, maximumBytes);
  const body = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(body) as unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
