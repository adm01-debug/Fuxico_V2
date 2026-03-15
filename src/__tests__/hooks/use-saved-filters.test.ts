import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavedFilters } from "@/hooks/use-saved-filters";

// Mock dependencies
vi.mock("@/lib/logger", () => ({
  log: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("useSavedFilters", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ===== INITIALIZATION =====
  describe("Initialization", () => {
    it("should start with empty filters", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));
      expect(result.current.filters).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should load filters from localStorage", () => {
      const stored = [
        {
          id: "f1",
          name: "Test",
          entity_type: "emails",
          filters: { status: "sent" },
          is_default: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];
      localStorage.setItem("fuxico_filters_emails", JSON.stringify(stored));

      const { result } = renderHook(() => useSavedFilters("emails"));
      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filters[0].name).toBe("Test");
    });

    it("should use correct storage key per entity type", () => {
      renderHook(() => useSavedFilters("documents"));
      // Key should be fuxico_filters_documents
      expect(localStorage.getItem("fuxico_filters_documents")).toBeNull();
    });

    it("should handle corrupted localStorage data", () => {
      localStorage.setItem("fuxico_filters_bad", "not-json{{{");
      const { result } = renderHook(() => useSavedFilters("bad"));
      expect(result.current.filters).toEqual([]);
    });
  });

  // ===== SAVING FILTERS =====
  describe("Saving filters", () => {
    it("should save a new filter", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));

      act(() => {
        result.current.saveFilter({
          name: "High Priority",
          filters: { status: "bounced" },
        });
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filters[0].name).toBe("High Priority");
    });

    it("should persist filter to localStorage", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));

      act(() => {
        result.current.saveFilter({
          name: "My Filter",
          filters: { search: "test" },
        });
      });

      const stored = JSON.parse(localStorage.getItem("fuxico_filters_emails")!);
      expect(stored).toHaveLength(1);
    });

    it("should save filter with default flag", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));

      act(() => {
        result.current.saveFilter({
          name: "Default Filter",
          filters: {},
          is_default: true,
        });
      });

      expect(result.current.filters[0].is_default).toBe(true);
    });

    it("should generate unique IDs for filters", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));

      act(() => {
        result.current.saveFilter({ name: "Filter 1", filters: {} });
      });
      act(() => {
        result.current.saveFilter({ name: "Filter 2", filters: {} });
      });

      expect(result.current.filters[0].id).not.toBe(result.current.filters[1].id);
    });

    it("should save multiple filters", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));

      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.saveFilter({ name: `Filter ${i}`, filters: { idx: i } });
        });
      }

      expect(result.current.filters).toHaveLength(10);
    });
  });

  // ===== DELETING FILTERS =====
  describe("Deleting filters", () => {
    it("should delete a filter by id", () => {
      const stored = [
        {
          id: "f1",
          name: "To Delete",
          entity_type: "emails",
          filters: {},
          is_default: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];
      localStorage.setItem("fuxico_filters_emails", JSON.stringify(stored));

      const { result } = renderHook(() => useSavedFilters("emails"));

      act(() => {
        result.current.deleteFilter("f1");
      });

      expect(result.current.filters).toHaveLength(0);
    });

    it("should not crash when deleting non-existent filter", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));

      act(() => {
        result.current.deleteFilter("non-existent");
      });

      expect(result.current.filters).toHaveLength(0);
    });
  });

  // ===== DEFAULT FILTER =====
  describe("Default filter", () => {
    it("should return undefined when no default set", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));
      expect(result.current.defaultFilter).toBeUndefined();
    });

    it("should set a filter as default", () => {
      const stored = [
        {
          id: "f1",
          name: "Filter 1",
          entity_type: "emails",
          filters: {},
          is_default: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "f2",
          name: "Filter 2",
          entity_type: "emails",
          filters: {},
          is_default: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];
      localStorage.setItem("fuxico_filters_emails", JSON.stringify(stored));

      const { result } = renderHook(() => useSavedFilters("emails"));

      act(() => {
        result.current.setDefault("f2");
      });

      expect(result.current.defaultFilter?.id).toBe("f2");
      // Only one default
      expect(result.current.filters.filter((f) => f.is_default)).toHaveLength(1);
    });
  });

  // ===== ERROR/LOADING STATES =====
  describe("States", () => {
    it("should have error as null", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));
      expect(result.current.error).toBeNull();
    });

    it("should not be saving initially", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));
      expect(result.current.isSaving).toBe(false);
    });

    it("should not be deleting initially", () => {
      const { result } = renderHook(() => useSavedFilters("emails"));
      expect(result.current.isDeleting).toBe(false);
    });
  });
});
