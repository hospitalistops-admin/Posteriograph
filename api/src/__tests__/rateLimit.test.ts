import { describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "../rateLimit.js";

describe("rate limit", () => {
  it("allows under limit then blocks", () => {
    resetRateLimits();
    expect(checkRateLimit("test-ip", 2).allowed).toBe(true);
    expect(checkRateLimit("test-ip", 2).allowed).toBe(true);
    const blocked = checkRateLimit("test-ip", 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
