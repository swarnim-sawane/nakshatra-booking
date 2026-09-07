import { describe, expect, it } from "vitest";
import { parseCalIdBookingUrl } from "../src/config/scheduling";

describe("parseCalIdBookingUrl", () => {
  it("accepts an HTTPS Cal ID event URL", () => {
    expect(parseCalIdBookingUrl("https://cal.id/example/consultation")?.hostname).toBe("cal.id");
  });
  it.each(["", "http://cal.id/example", "https://evil.example/book", "javascript:alert(1)"])(
    "rejects unsafe value %s",
    (value) => expect(parseCalIdBookingUrl(value)).toBeNull(),
  );
});
