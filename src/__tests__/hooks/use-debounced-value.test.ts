import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===== BASIC DEBOUNCE =====
  describe("Basic debounce behavior", () => {
    it("should return initial value immediately", () => {
      const { result } = renderHook(() => useDebouncedValue("hello", 300));
      expect(result.current).toBe("hello");
    });

    it("should not update before delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: "hello" } }
      );

      rerender({ value: "world" });
      vi.advanceTimersByTime(200);
      expect(result.current).toBe("hello");
    });

    it("should update after delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: "hello" } }
      );

      rerender({ value: "world" });
      vi.advanceTimersByTime(300);
      expect(result.current).toBe("world");
    });

    it("should reset timer on rapid changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "ab" });
      vi.advanceTimersByTime(100);
      rerender({ value: "abc" });
      vi.advanceTimersByTime(100);
      rerender({ value: "abcd" });
      vi.advanceTimersByTime(100);

      // Still showing initial since timer keeps resetting
      expect(result.current).toBe("a");

      vi.advanceTimersByTime(200);
      expect(result.current).toBe("abcd");
    });
  });

  // ===== DELAY VALUES =====
  describe("Different delay values", () => {
    it("should use default delay of 300ms", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });
      vi.advanceTimersByTime(299);
      expect(result.current).toBe("initial");

      vi.advanceTimersByTime(1);
      expect(result.current).toBe("updated");
    });

    it("should work with 0ms delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 0),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });
      vi.advanceTimersByTime(0);
      expect(result.current).toBe("updated");
    });

    it("should work with 1000ms delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 1000),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });
      vi.advanceTimersByTime(999);
      expect(result.current).toBe("initial");

      vi.advanceTimersByTime(1);
      expect(result.current).toBe("updated");
    });
  });

  // ===== TYPE HANDLING =====
  describe("Different value types", () => {
    it("should handle string values", () => {
      const { result } = renderHook(() => useDebouncedValue("text", 100));
      expect(result.current).toBe("text");
    });

    it("should handle number values", () => {
      const { result } = renderHook(() => useDebouncedValue(42, 100));
      expect(result.current).toBe(42);
    });

    it("should handle boolean values", () => {
      const { result } = renderHook(() => useDebouncedValue(true, 100));
      expect(result.current).toBe(true);
    });

    it("should handle null values", () => {
      const { result } = renderHook(() => useDebouncedValue(null, 100));
      expect(result.current).toBeNull();
    });

    it("should handle object values", () => {
      const obj = { key: "value" };
      const { result } = renderHook(() => useDebouncedValue(obj, 100));
      expect(result.current).toEqual(obj);
    });

    it("should handle array values", () => {
      const arr = [1, 2, 3];
      const { result } = renderHook(() => useDebouncedValue(arr, 100));
      expect(result.current).toEqual(arr);
    });
  });

  // ===== CLEANUP =====
  describe("Cleanup on unmount", () => {
    it("should clear timeout on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const { rerender, unmount } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: "hello" } }
      );

      rerender({ value: "world" });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  // ===== SEARCH INPUT SIMULATION =====
  describe("Search input simulation", () => {
    it("should simulate typing a search query", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: "" } }
      );

      // User types "react"
      rerender({ value: "r" });
      vi.advanceTimersByTime(50);
      rerender({ value: "re" });
      vi.advanceTimersByTime(50);
      rerender({ value: "rea" });
      vi.advanceTimersByTime(50);
      rerender({ value: "reac" });
      vi.advanceTimersByTime(50);
      rerender({ value: "react" });

      // Should still be empty since timer keeps resetting
      expect(result.current).toBe("");

      // Wait for debounce
      vi.advanceTimersByTime(300);
      expect(result.current).toBe("react");
    });

    it("should handle clearing search", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: "react" } }
      );

      rerender({ value: "" });
      vi.advanceTimersByTime(300);
      expect(result.current).toBe("");
    });
  });
});
