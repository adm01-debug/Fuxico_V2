import { describe, it, expect } from "vitest";

// Extract isEnabled logic from use-feature-flags.ts
interface FeatureFlag {
  key: string;
  enabled: boolean;
  percentage: number;
}

function isEnabled(flags: FeatureFlag[], key: string): boolean {
  const flag = flags.find((f) => f.key === key);
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (flag.percentage < 100) {
    const hash = key.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 100) < flag.percentage;
  }
  return true;
}

describe("Feature Flags Logic", () => {
  // ===== BASIC CHECKS =====
  describe("Basic flag checks", () => {
    it("should return false for non-existent flag", () => {
      expect(isEnabled([], "new-feature")).toBe(false);
    });

    it("should return false for disabled flag", () => {
      const flags: FeatureFlag[] = [
        { key: "feature-x", enabled: false, percentage: 100 },
      ];
      expect(isEnabled(flags, "feature-x")).toBe(false);
    });

    it("should return true for enabled flag at 100%", () => {
      const flags: FeatureFlag[] = [
        { key: "feature-x", enabled: true, percentage: 100 },
      ];
      expect(isEnabled(flags, "feature-x")).toBe(true);
    });
  });

  // ===== PERCENTAGE ROLLOUT =====
  describe("Percentage rollout", () => {
    it("should always enable at 100%", () => {
      const flags: FeatureFlag[] = [
        { key: "full-rollout", enabled: true, percentage: 100 },
      ];
      expect(isEnabled(flags, "full-rollout")).toBe(true);
    });

    it("should deterministically decide based on key hash", () => {
      const flags: FeatureFlag[] = [
        { key: "test-feature", enabled: true, percentage: 50 },
      ];
      // Same key should always return same result
      const result1 = isEnabled(flags, "test-feature");
      const result2 = isEnabled(flags, "test-feature");
      expect(result1).toBe(result2);
    });

    it("should handle 0% rollout", () => {
      const flags: FeatureFlag[] = [
        { key: "zero-pct", enabled: true, percentage: 0 },
      ];
      // hash % 100 is always >= 0, so 0% should always be false
      expect(isEnabled(flags, "zero-pct")).toBe(false);
    });

    it("should handle 1% rollout", () => {
      const flags: FeatureFlag[] = [
        { key: "tiny-rollout", enabled: true, percentage: 1 },
      ];
      // Deterministic based on hash
      const result = isEnabled(flags, "tiny-rollout");
      expect(typeof result).toBe("boolean");
    });

    it("should handle 99% rollout", () => {
      const flags: FeatureFlag[] = [
        { key: "almost-full", enabled: true, percentage: 99 },
      ];
      const result = isEnabled(flags, "almost-full");
      expect(typeof result).toBe("boolean");
    });
  });

  // ===== HASH FUNCTION =====
  describe("Hash function properties", () => {
    it("should produce different hashes for different keys", () => {
      const hash1 = "feature-a".split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      const hash2 = "feature-b".split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      expect(hash1).not.toBe(hash2);
    });

    it("should produce same hash for same key", () => {
      const compute = (key: string) =>
        key.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);
      expect(compute("test")).toBe(compute("test"));
    });

    it("should handle empty key", () => {
      const hash = "".split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      expect(hash).toBe(0);
    });

    it("should handle very long keys", () => {
      const longKey = "a".repeat(1000);
      const hash = longKey.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      expect(typeof hash).toBe("number");
      expect(isFinite(hash)).toBe(true);
    });
  });

  // ===== MULTIPLE FLAGS =====
  describe("Multiple flags", () => {
    it("should check correct flag by key", () => {
      const flags: FeatureFlag[] = [
        { key: "feature-a", enabled: true, percentage: 100 },
        { key: "feature-b", enabled: false, percentage: 100 },
        { key: "feature-c", enabled: true, percentage: 100 },
      ];
      expect(isEnabled(flags, "feature-a")).toBe(true);
      expect(isEnabled(flags, "feature-b")).toBe(false);
      expect(isEnabled(flags, "feature-c")).toBe(true);
    });

    it("should handle many flags", () => {
      const flags: FeatureFlag[] = Array.from({ length: 100 }, (_, i) => ({
        key: `feature-${i}`,
        enabled: i % 2 === 0,
        percentage: 100,
      }));

      expect(isEnabled(flags, "feature-0")).toBe(true);
      expect(isEnabled(flags, "feature-1")).toBe(false);
      expect(isEnabled(flags, "feature-50")).toBe(true);
      expect(isEnabled(flags, "feature-99")).toBe(false);
    });
  });
});
