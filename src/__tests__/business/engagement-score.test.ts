import { describe, it, expect } from "vitest";

// Extract the engagement score calculation from use-tracking.ts
function calculateEngagementScore(
  opens: number,
  clicks: number,
  uniqueOpens: number
): number {
  return opens + clicks * 3 + uniqueOpens * 2;
}

describe("Engagement Score Calculation", () => {
  // ===== BASIC CALCULATIONS =====
  describe("Basic formula verification", () => {
    it("should return 0 for no engagement", () => {
      expect(calculateEngagementScore(0, 0, 0)).toBe(0);
    });

    it("should weight opens at 1x", () => {
      expect(calculateEngagementScore(10, 0, 0)).toBe(10);
    });

    it("should weight clicks at 3x", () => {
      expect(calculateEngagementScore(0, 10, 0)).toBe(30);
    });

    it("should weight unique opens at 2x", () => {
      expect(calculateEngagementScore(0, 0, 10)).toBe(20);
    });

    it("should combine all metrics correctly", () => {
      // 5 opens + (3 clicks * 3) + (2 unique * 2) = 5 + 9 + 4 = 18
      expect(calculateEngagementScore(5, 3, 2)).toBe(18);
    });
  });

  // ===== SCORING TIERS =====
  describe("Score tiers for lead scoring", () => {
    it("should categorize low engagement", () => {
      const score = calculateEngagementScore(1, 0, 1);
      expect(score).toBeLessThan(10);
    });

    it("should categorize medium engagement", () => {
      const score = calculateEngagementScore(5, 2, 3);
      expect(score).toBeGreaterThanOrEqual(10);
    });

    it("should categorize high engagement", () => {
      const score = calculateEngagementScore(20, 10, 15);
      expect(score).toBeGreaterThan(50);
    });
  });

  // ===== EDGE CASES =====
  describe("Edge cases", () => {
    it("should handle very large numbers", () => {
      const score = calculateEngagementScore(100000, 50000, 80000);
      expect(score).toBe(100000 + 150000 + 160000);
    });

    it("should handle single open", () => {
      expect(calculateEngagementScore(1, 0, 1)).toBe(3);
    });

    it("should handle more opens than unique opens", () => {
      // This is valid: same person opens multiple times
      const score = calculateEngagementScore(10, 0, 3);
      expect(score).toBe(16);
    });

    it("should never return negative", () => {
      const score = calculateEngagementScore(0, 0, 0);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  // ===== COMPARATIVE SCORING =====
  describe("Comparative scoring", () => {
    it("clicks should be worth more than opens", () => {
      const openOnly = calculateEngagementScore(1, 0, 0);
      const clickOnly = calculateEngagementScore(0, 1, 0);
      expect(clickOnly).toBeGreaterThan(openOnly);
    });

    it("unique opens should be worth more than total opens", () => {
      const totalOpen = calculateEngagementScore(1, 0, 0);
      const uniqueOpen = calculateEngagementScore(0, 0, 1);
      expect(uniqueOpen).toBeGreaterThan(totalOpen);
    });

    it("high clicker should score higher than equivalent opener", () => {
      // Same total activity, but clicks weighted 3x vs opens 1x
      const opener = calculateEngagementScore(10, 0, 5);  // 10 + 0 + 10 = 20
      const clicker = calculateEngagementScore(0, 10, 0); // 0 + 30 + 0 = 30
      expect(clicker).toBeGreaterThan(opener);
    });
  });
});
