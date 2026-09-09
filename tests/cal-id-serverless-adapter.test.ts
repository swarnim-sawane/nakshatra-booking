import { describe, expect, it, vi } from "vitest";
import handler from "../api/cal-id-slots";

describe("Cal ID serverless adapter", () => {
  it("forwards the normalized response and cache headers", async () => {
    const setHeader = vi.fn();
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));

    await handler(
      {
        method: "POST",
        url: "/api/cal-id-slots",
      },
      { setHeader, status },
    );

    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(status).toHaveBeenCalledWith(405);
    expect(json).toHaveBeenCalledWith({ error: "Method not allowed." });
  });
});
