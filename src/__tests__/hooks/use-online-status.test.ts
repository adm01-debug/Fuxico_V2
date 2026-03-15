import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "@/hooks/use-online-status";

describe("useOnlineStatus", () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      writable: true,
    });
  });

  // ===== INITIAL STATE =====
  describe("Initial state", () => {
    it("should return true when online", () => {
      Object.defineProperty(navigator, "onLine", { value: true, writable: true });
      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current).toBe(true);
    });

    it("should return false when offline", () => {
      Object.defineProperty(navigator, "onLine", { value: false, writable: true });
      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current).toBe(false);
    });
  });

  // ===== STATE CHANGES =====
  describe("State transitions", () => {
    it("should update to offline when offline event fires", () => {
      Object.defineProperty(navigator, "onLine", { value: true, writable: true });
      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current).toBe(false);
    });

    it("should update to online when online event fires", () => {
      Object.defineProperty(navigator, "onLine", { value: false, writable: true });
      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        window.dispatchEvent(new Event("online"));
      });

      expect(result.current).toBe(true);
    });

    it("should handle rapid online/offline toggles", () => {
      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });
      expect(result.current).toBe(false);

      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(result.current).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });
      expect(result.current).toBe(false);
    });
  });

  // ===== CLEANUP =====
  describe("Cleanup", () => {
    it("should remove event listeners on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useOnlineStatus());

      unmount();

      expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});
