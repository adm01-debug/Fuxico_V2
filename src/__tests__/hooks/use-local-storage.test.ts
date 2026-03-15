import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Mock logger
vi.mock("@/lib/logger", () => ({
  log: { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
}));

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ===== INITIALIZATION =====
  describe("Initialization", () => {
    it("should return initial value when key does not exist", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));
      expect(result.current[0]).toBe("default");
    });

    it("should return stored value when key exists", () => {
      localStorage.setItem("test-key", JSON.stringify("stored-value"));
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));
      expect(result.current[0]).toBe("stored-value");
    });

    it("should handle complex initial values", () => {
      const initial = { name: "test", items: [1, 2, 3], nested: { a: true } };
      const { result } = renderHook(() => useLocalStorage("complex-key", initial));
      expect(result.current[0]).toEqual(initial);
    });

    it("should handle number initial values", () => {
      const { result } = renderHook(() => useLocalStorage("num-key", 42));
      expect(result.current[0]).toBe(42);
    });

    it("should handle boolean initial values", () => {
      const { result } = renderHook(() => useLocalStorage("bool-key", true));
      expect(result.current[0]).toBe(true);
    });

    it("should handle null initial values", () => {
      const { result } = renderHook(() => useLocalStorage("null-key", null));
      expect(result.current[0]).toBeNull();
    });

    it("should handle array initial values", () => {
      const { result } = renderHook(() => useLocalStorage("arr-key", [1, 2, 3]));
      expect(result.current[0]).toEqual([1, 2, 3]);
    });
  });

  // ===== SETTING VALUES =====
  describe("Setting values", () => {
    it("should update state and localStorage", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      act(() => {
        result.current[1]("updated");
      });

      expect(result.current[0]).toBe("updated");
      expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("updated");
    });

    it("should handle function updater", () => {
      const { result } = renderHook(() => useLocalStorage("count-key", 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
    });

    it("should handle setting null", () => {
      const { result } = renderHook(() =>
        useLocalStorage<string | null>("nullable-key", "initial")
      );

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBeNull();
    });

    it("should handle setting objects", () => {
      const { result } = renderHook(() =>
        useLocalStorage("obj-key", { name: "old" })
      );

      act(() => {
        result.current[1]({ name: "new" });
      });

      expect(result.current[0]).toEqual({ name: "new" });
    });

    it("should handle setting arrays", () => {
      const { result } = renderHook(() =>
        useLocalStorage<number[]>("arr-key", [])
      );

      act(() => {
        result.current[1]([1, 2, 3]);
      });

      expect(result.current[0]).toEqual([1, 2, 3]);
    });
  });

  // ===== REMOVING VALUES =====
  describe("Removing values", () => {
    it("should remove from localStorage and reset to initial", () => {
      localStorage.setItem("test-key", JSON.stringify("stored"));
      const { result } = renderHook(() => useLocalStorage("test-key", "default"));

      act(() => {
        result.current[2](); // removeValue
      });

      expect(result.current[0]).toBe("default");
      expect(localStorage.getItem("test-key")).toBeNull();
    });
  });

  // ===== ERROR HANDLING =====
  describe("Error handling", () => {
    it("should handle corrupted JSON in localStorage", () => {
      localStorage.setItem("bad-key", "not-valid-json{{{");
      const { result } = renderHook(() => useLocalStorage("bad-key", "fallback"));
      expect(result.current[0]).toBe("fallback");
    });

    it("should handle localStorage quota exceeded", () => {
      const { result } = renderHook(() => useLocalStorage("quota-key", "initial"));

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new DOMException("QuotaExceededError");
      });

      act(() => {
        result.current[1]("large-value");
      });

      // Should not crash
      localStorage.setItem = originalSetItem;
    });
  });

  // ===== MULTIPLE KEYS =====
  describe("Multiple keys independence", () => {
    it("should maintain separate values for different keys", () => {
      const { result: result1 } = renderHook(() => useLocalStorage("key1", "a"));
      const { result: result2 } = renderHook(() => useLocalStorage("key2", "b"));

      act(() => {
        result1.current[1]("updated-a");
      });

      expect(result1.current[0]).toBe("updated-a");
      expect(result2.current[0]).toBe("b");
    });
  });

  // ===== EDGE CASES =====
  describe("Edge cases", () => {
    it("should handle empty string key", () => {
      const { result } = renderHook(() => useLocalStorage("", "default"));
      expect(result.current[0]).toBe("default");
    });

    it("should handle very long values", () => {
      const longString = "x".repeat(10000);
      const { result } = renderHook(() => useLocalStorage("long-key", ""));

      act(() => {
        result.current[1](longString);
      });

      expect(result.current[0]).toHaveLength(10000);
    });

    it("should handle special characters in key", () => {
      const { result } = renderHook(() =>
        useLocalStorage("special/key:with@chars", "value")
      );
      expect(result.current[0]).toBe("value");
    });

    it("should handle Date objects (serialized as string)", () => {
      const date = new Date("2024-01-01").toISOString();
      const { result } = renderHook(() => useLocalStorage("date-key", date));
      expect(result.current[0]).toBe(date);
    });
  });
});
