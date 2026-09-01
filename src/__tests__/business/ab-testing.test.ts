import { describe, it, expect } from "vitest";

// Extract from use-ab-tests.ts
function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
    a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

interface ABTestData {
  variant_a_sends: number;
  variant_a_opens: number;
  variant_b_sends: number;
  variant_b_opens: number;
}

function determineWinner(
  test: ABTestData,
  minSends: number = 30
): { winner: "A" | "B" | null; zScore: number; confidence: number; significant: boolean } {
  if (test.variant_a_sends < minSends || test.variant_b_sends < minSends) {
    return { winner: null, zScore: 0, confidence: 0, significant: false };
  }

  const rateA = test.variant_a_opens / test.variant_a_sends;
  const rateB = test.variant_b_opens / test.variant_b_sends;
  const totalSends = test.variant_a_sends + test.variant_b_sends;
  const pooledRate = (test.variant_a_opens + test.variant_b_opens) / totalSends;
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / test.variant_a_sends + 1 / test.variant_b_sends));

  if (se === 0) {
    return { winner: null, zScore: 0, confidence: 0, significant: false };
  }

  const zScore = Math.abs(rateA - rateB) / se;
  const significant = zScore > 1.96;
  const confidence = Math.min(99, Math.round((1 - 2 * (1 - normalCDF(zScore))) * 100));
  const winner = significant ? (rateA > rateB ? "A" : "B") : null;

  return { winner, zScore, confidence, significant };
}

describe("Normal CDF (Z-test)", () => {
  // ===== MATHEMATICAL ACCURACY =====
  describe("Known values", () => {
    it("should return 0.5 for z=0", () => {
      expect(normalCDF(0)).toBeCloseTo(0.5, 4);
    });

    it("should return ~0.8413 for z=1", () => {
      expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
    });

    it("should return ~0.9772 for z=2", () => {
      expect(normalCDF(2)).toBeCloseTo(0.9772, 3);
    });

    it("should return ~0.9987 for z=3", () => {
      expect(normalCDF(3)).toBeCloseTo(0.9987, 3);
    });

    it("should return ~0.1587 for z=-1", () => {
      expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
    });

    it("should return ~0.0228 for z=-2", () => {
      expect(normalCDF(-2)).toBeCloseTo(0.0228, 3);
    });

    it("should be symmetric: CDF(x) + CDF(-x) ≈ 1", () => {
      for (const x of [0.5, 1, 1.5, 2, 2.5, 3]) {
        expect(normalCDF(x) + normalCDF(-x)).toBeCloseTo(1, 4);
      }
    });

    it("should approach 1 for large positive z", () => {
      expect(normalCDF(5)).toBeGreaterThan(0.999);
    });

    it("should approach 0 for large negative z", () => {
      expect(normalCDF(-5)).toBeLessThan(0.001);
    });
  });
});

describe("A/B Test Winner Determination", () => {
  // ===== MINIMUM SAMPLE SIZE =====
  describe("Minimum sample size", () => {
    it("should not declare winner with too few sends", () => {
      const result = determineWinner({
        variant_a_sends: 10,
        variant_a_opens: 8,
        variant_b_sends: 10,
        variant_b_opens: 2,
      });
      expect(result.winner).toBeNull();
      expect(result.significant).toBe(false);
    });

    it("should not declare winner when only A has enough sends", () => {
      const result = determineWinner({
        variant_a_sends: 50,
        variant_a_opens: 25,
        variant_b_sends: 20,
        variant_b_opens: 10,
      });
      expect(result.winner).toBeNull();
    });

    it("should not declare winner when only B has enough sends", () => {
      const result = determineWinner({
        variant_a_sends: 20,
        variant_a_opens: 10,
        variant_b_sends: 50,
        variant_b_opens: 25,
      });
      expect(result.winner).toBeNull();
    });
  });

  // ===== CLEAR WINNERS =====
  describe("Clear winner scenarios", () => {
    it("should declare A as winner with significantly higher open rate", () => {
      const result = determineWinner({
        variant_a_sends: 100,
        variant_a_opens: 50, // 50% open rate
        variant_b_sends: 100,
        variant_b_opens: 20, // 20% open rate
      });
      expect(result.winner).toBe("A");
      expect(result.significant).toBe(true);
    });

    it("should declare B as winner with significantly higher open rate", () => {
      const result = determineWinner({
        variant_a_sends: 100,
        variant_a_opens: 20, // 20% open rate
        variant_b_sends: 100,
        variant_b_opens: 50, // 50% open rate
      });
      expect(result.winner).toBe("B");
      expect(result.significant).toBe(true);
    });
  });

  // ===== NO SIGNIFICANT DIFFERENCE =====
  describe("No significant difference", () => {
    it("should not declare winner when rates are similar", () => {
      const result = determineWinner({
        variant_a_sends: 100,
        variant_a_opens: 30, // 30%
        variant_b_sends: 100,
        variant_b_opens: 32, // 32%
      });
      expect(result.winner).toBeNull();
      expect(result.significant).toBe(false);
    });

    it("should not declare winner for equal rates", () => {
      const result = determineWinner({
        variant_a_sends: 100,
        variant_a_opens: 30,
        variant_b_sends: 100,
        variant_b_opens: 30,
      });
      expect(result.winner).toBeNull();
    });
  });

  // ===== EDGE CASES =====
  describe("Edge cases", () => {
    it("should handle zero opens for both variants", () => {
      const result = determineWinner({
        variant_a_sends: 50,
        variant_a_opens: 0,
        variant_b_sends: 50,
        variant_b_opens: 0,
      });
      // se = 0, should return null
      expect(result.winner).toBeNull();
    });

    it("should handle 100% open rate for both", () => {
      const result = determineWinner({
        variant_a_sends: 50,
        variant_a_opens: 50,
        variant_b_sends: 50,
        variant_b_opens: 50,
      });
      // se = 0, should return null
      expect(result.winner).toBeNull();
    });

    it("should handle asymmetric sample sizes", () => {
      const result = determineWinner({
        variant_a_sends: 200,
        variant_a_opens: 100, // 50%
        variant_b_sends: 50,
        variant_b_opens: 10, // 20%
      });
      expect(result.winner).toBe("A");
    });

    it("confidence should be between 0 and 99", () => {
      const result = determineWinner({
        variant_a_sends: 1000,
        variant_a_opens: 500,
        variant_b_sends: 1000,
        variant_b_opens: 200,
      });
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(99);
    });

    it("should handle very large sample sizes with meaningful difference", () => {
      const result = determineWinner({
        variant_a_sends: 100000,
        variant_a_opens: 31000, // 31%
        variant_b_sends: 100000,
        variant_b_opens: 30000, // 30%
      });
      // With massive samples, 1% difference is significant
      expect(result.significant).toBe(true);
    });
  });

  // ===== CUSTOM MIN SENDS =====
  describe("Custom minimum sends", () => {
    it("should use custom minSends threshold", () => {
      const result = determineWinner(
        {
          variant_a_sends: 40,
          variant_a_opens: 30,
          variant_b_sends: 40,
          variant_b_opens: 5,
        },
        50 // higher threshold
      );
      expect(result.winner).toBeNull();
    });

    it("should work with lower threshold", () => {
      const result = determineWinner(
        {
          variant_a_sends: 15,
          variant_a_opens: 12,
          variant_b_sends: 15,
          variant_b_opens: 2,
        },
        10
      );
      expect(result.significant).toBe(true);
      expect(result.winner).toBe("A");
    });
  });
});
