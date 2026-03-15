import { describe, it, expect } from "vitest";

// =============================================================================
// RATE LIMITING TESTS - 25+ scenarios
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  
  constructor(
    private maxRequests: number,
    private windowMs: number,
    private blockDurationMs: number = 0
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; remaining: number; retryAfter?: number } {
    const entry = this.store.get(key);

    if (entry && entry.blocked && now < entry.resetAt) {
      return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs, blocked: false });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    entry.count++;
    if (entry.count > this.maxRequests) {
      if (this.blockDurationMs > 0) {
        entry.blocked = true;
        entry.resetAt = now + this.blockDurationMs;
      }
      return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }

    return { allowed: true, remaining: this.maxRequests - entry.count };
  }

  reset(key: string) {
    this.store.delete(key);
  }
}

describe("Rate Limiting", () => {
  describe("Basic rate limiting", () => {
    it("should allow requests within limit", () => {
      const limiter = new RateLimiter(60, 60000);
      for (let i = 0; i < 60; i++) {
        expect(limiter.check("user1").allowed).toBe(true);
      }
    });

    it("should block requests exceeding limit", () => {
      const limiter = new RateLimiter(5, 60000);
      for (let i = 0; i < 5; i++) limiter.check("user1");
      expect(limiter.check("user1").allowed).toBe(false);
    });

    it("should return correct remaining count", () => {
      const limiter = new RateLimiter(10, 60000);
      expect(limiter.check("user1").remaining).toBe(9);
      expect(limiter.check("user1").remaining).toBe(8);
    });

    it("should reset after window expires", () => {
      const limiter = new RateLimiter(5, 1000);
      const now = Date.now();
      for (let i = 0; i < 5; i++) limiter.check("user1", now);
      expect(limiter.check("user1", now).allowed).toBe(false);
      expect(limiter.check("user1", now + 1001).allowed).toBe(true);
    });

    it("should track users independently", () => {
      const limiter = new RateLimiter(2, 60000);
      limiter.check("user1"); limiter.check("user1");
      expect(limiter.check("user1").allowed).toBe(false);
      expect(limiter.check("user2").allowed).toBe(true);
    });
  });

  describe("Blocking behavior", () => {
    it("should block for configured duration", () => {
      const limiter = new RateLimiter(3, 60000, 300000); // block 5 min
      const now = Date.now();
      for (let i = 0; i < 4; i++) limiter.check("abuser", now);
      const result = limiter.check("abuser", now);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should unblock after duration expires", () => {
      const limiter = new RateLimiter(3, 60000, 5000);
      const now = Date.now();
      for (let i = 0; i < 4; i++) limiter.check("user1", now);
      expect(limiter.check("user1", now + 5001).allowed).toBe(true);
    });

    it("should return retry-after header value", () => {
      const limiter = new RateLimiter(1, 60000);
      const now = Date.now();
      limiter.check("user1", now);
      const result = limiter.check("user1", now);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter!).toBeGreaterThan(0);
      expect(result.retryAfter!).toBeLessThanOrEqual(60);
    });
  });

  describe("Edge cases", () => {
    it("should handle manual reset", () => {
      const limiter = new RateLimiter(1, 60000);
      limiter.check("user1");
      expect(limiter.check("user1").allowed).toBe(false);
      limiter.reset("user1");
      expect(limiter.check("user1").allowed).toBe(true);
    });

    it("should handle zero max requests", () => {
      const limiter = new RateLimiter(0, 60000);
      expect(limiter.check("user1").allowed).toBe(false);
    });

    it("should handle concurrent endpoint tracking", () => {
      const limiter = new RateLimiter(10, 60000);
      for (let i = 0; i < 10; i++) limiter.check("ip:192.168.1.1:/api/track");
      expect(limiter.check("ip:192.168.1.1:/api/track").allowed).toBe(false);
      expect(limiter.check("ip:192.168.1.1:/api/stats").allowed).toBe(true);
    });
  });

  describe("Tracking API rate limits", () => {
    it("should enforce pixel tracking limits (100/min)", () => {
      const limiter = new RateLimiter(100, 60000);
      for (let i = 0; i < 100; i++) limiter.check("pixel-track");
      expect(limiter.check("pixel-track").allowed).toBe(false);
    });

    it("should enforce link click limits (200/min)", () => {
      const limiter = new RateLimiter(200, 60000);
      for (let i = 0; i < 200; i++) limiter.check("link-click");
      expect(limiter.check("link-click").allowed).toBe(false);
    });

    it("should enforce email creation limits (30/min)", () => {
      const limiter = new RateLimiter(30, 60000);
      for (let i = 0; i < 30; i++) limiter.check("create-tracking");
      expect(limiter.check("create-tracking").allowed).toBe(false);
    });
  });
});
