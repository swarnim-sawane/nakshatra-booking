import { handleCalIdAvailabilityRequest } from "../src/server/calIdAvailability";

declare const process: {
  env: Record<string, string | undefined>;
};

type VercelRequest = {
  method?: string;
  url?: string;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(body: unknown): void;
  };
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const result = await handleCalIdAvailabilityRequest({
    method: request.method ?? "GET",
    url: request.url ?? "/api/cal-id-slots",
    apiKey: process.env.CALID_API_KEY,
  });

  Object.entries(result.headers).forEach(([name, value]) => {
    response.setHeader(name, value);
  });
  response.status(result.status).json(result.body);
}
