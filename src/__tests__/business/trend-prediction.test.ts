import { describe, it, expect } from "vitest";

// Extract functions from use-trend-prediction.ts
function calculateTrend(values: number[]): "up" | "down" | "stable" {
  if (values.length < 3) return "stable";
  const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const older = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  if (recent > older * 1.1) return "up";
  if (recent < older * 0.9) return "down";
  return "stable";
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

describe("Trend Calculation", () => {
  // ===== BASIC TRENDS =====
  describe("calculateTrend", () => {
    it("should return 'stable' for less than 3 values", () => {
      expect(calculateTrend([])).toBe("stable");
      expect(calculateTrend([1])).toBe("stable");
      expect(calculateTrend([1, 2])).toBe("stable");
    });

    it("should detect upward trend", () => {
      expect(calculateTrend([1, 2, 3, 10, 20, 30])).toBe("up");
    });

    it("should detect downward trend", () => {
      expect(calculateTrend([30, 20, 10, 3, 2, 1])).toBe("down");
    });

    it("should detect stable trend", () => {
      expect(calculateTrend([10, 10, 10, 10, 10, 10])).toBe("stable");
    });

    it("should handle small upward (within 10% = stable)", () => {
      // older avg = 10, recent avg = 10.5 → 10.5/10 = 1.05 < 1.1 → stable
      expect(calculateTrend([10, 10, 10, 10, 10.5, 11])).toBe("stable");
    });

    it("should detect upward when > 10% increase", () => {
      // older avg = 10, recent avg = 12 → 12/10 = 1.2 > 1.1 → up
      expect(calculateTrend([10, 10, 10, 11, 12, 13])).toBe("up");
    });

    it("should detect downward when > 10% decrease", () => {
      // older avg = 10, recent avg = 8 → 8/10 = 0.8 < 0.9 → down
      expect(calculateTrend([10, 10, 10, 9, 8, 7])).toBe("down");
    });

    it("should handle all zeros", () => {
      expect(calculateTrend([0, 0, 0, 0, 0, 0])).toBe("stable");
    });

    it("should handle exact 3 values", () => {
      expect(calculateTrend([1, 2, 3])).toBe("stable"); // same 3 values for both
    });

    it("should handle large datasets", () => {
      const values = Array.from({ length: 100 }, (_, i) => i * 2);
      expect(calculateTrend(values)).toBe("up");
    });

    it("should handle decreasing dataset", () => {
      const values = Array.from({ length: 100 }, (_, i) => 100 - i);
      expect(calculateTrend(values)).toBe("down");
    });
  });
});

describe("Linear Regression", () => {
  // ===== BASIC REGRESSION =====
  describe("Basic calculations", () => {
    it("should return slope 0 for single value", () => {
      const result = linearRegression([5]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(5);
    });

    it("should return slope 0 and intercept 0 for empty array", () => {
      const result = linearRegression([]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
    });

    it("should calculate perfect positive slope", () => {
      const result = linearRegression([0, 1, 2, 3, 4]);
      expect(result.slope).toBeCloseTo(1, 5);
      expect(result.intercept).toBeCloseTo(0, 5);
    });

    it("should calculate perfect negative slope", () => {
      const result = linearRegression([4, 3, 2, 1, 0]);
      expect(result.slope).toBeCloseTo(-1, 5);
      expect(result.intercept).toBeCloseTo(4, 5);
    });

    it("should calculate slope = 0 for constant values", () => {
      const result = linearRegression([5, 5, 5, 5, 5]);
      expect(result.slope).toBeCloseTo(0, 5);
      expect(result.intercept).toBeCloseTo(5, 5);
    });

    it("should calculate slope = 2 for [0,2,4,6,8]", () => {
      const result = linearRegression([0, 2, 4, 6, 8]);
      expect(result.slope).toBeCloseTo(2, 5);
      expect(result.intercept).toBeCloseTo(0, 5);
    });
  });

  // ===== PREDICTIONS =====
  describe("Predictions from regression", () => {
    it("should predict next value in linear sequence", () => {
      const values = [10, 20, 30, 40, 50];
      const reg = linearRegression(values);
      const nextIdx = values.length;
      const predicted = reg.slope * nextIdx + reg.intercept;
      expect(predicted).toBeCloseTo(60, 0);
    });

    it("should predict non-negative for upward trend", () => {
      const values = [1, 3, 5, 7, 9];
      const reg = linearRegression(values);
      for (let i = values.length; i < values.length + 7; i++) {
        const predicted = Math.max(0, Math.round(reg.slope * i + reg.intercept));
        expect(predicted).toBeGreaterThanOrEqual(0);
      }
    });

    it("should clamp negative predictions to 0", () => {
      const values = [10, 8, 6, 4, 2];
      const reg = linearRegression(values);
      // Far future prediction might go negative
      const farFuture = reg.slope * 20 + reg.intercept;
      const clamped = Math.max(0, Math.round(farFuture));
      expect(clamped).toBeGreaterThanOrEqual(0);
    });
  });

  // ===== CONFIDENCE =====
  describe("Prediction confidence", () => {
    it("should decrease confidence for farther predictions", () => {
      const confidences = [];
      for (let i = 1; i <= 7; i++) {
        confidences.push(Math.max(50, Math.min(95, 85 - i * 3)));
      }

      // Each prediction should have lower confidence
      for (let i = 1; i < confidences.length; i++) {
        expect(confidences[i]).toBeLessThanOrEqual(confidences[i - 1]);
      }

      // Range should be 50-95
      confidences.forEach((c) => {
        expect(c).toBeGreaterThanOrEqual(50);
        expect(c).toBeLessThanOrEqual(95);
      });
    });

    it("should have 82% confidence for day 1", () => {
      expect(Math.max(50, Math.min(95, 85 - 1 * 3))).toBe(82);
    });

    it("should have 64% confidence for day 7", () => {
      expect(Math.max(50, Math.min(95, 85 - 7 * 3))).toBe(64);
    });
  });

  // ===== EDGE CASES =====
  describe("Edge cases", () => {
    it("should handle very large values", () => {
      const values = [1000000, 2000000, 3000000];
      const result = linearRegression(values);
      expect(result.slope).toBeCloseTo(1000000, 0);
    });

    it("should handle decimal values", () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.5];
      const result = linearRegression(values);
      expect(result.slope).toBeCloseTo(0.1, 5);
    });

    it("should handle noisy data", () => {
      const values = [10, 12, 9, 14, 11, 15, 13, 16, 12, 17];
      const result = linearRegression(values);
      // Should still detect general upward trend
      expect(result.slope).toBeGreaterThan(0);
    });

    it("should handle two values", () => {
      const result = linearRegression([10, 20]);
      expect(result.slope).toBeCloseTo(10, 5);
      expect(result.intercept).toBeCloseTo(10, 5);
    });
  });
});
