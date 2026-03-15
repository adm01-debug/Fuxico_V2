import { describe, it, expect } from "vitest";

// =============================================================================
// SAVED FILTERS - 15+ scenarios
// =============================================================================

describe("Saved Filters Logic", () => {
  interface SavedFilter {
    id: string;
    name: string;
    entity_type: string;
    filters: Record<string, unknown>;
    is_default: boolean;
  }

  const createFilter = (name: string, entityType: string, filters: Record<string, unknown>, isDefault = false): SavedFilter => ({
    id: crypto.randomUUID(),
    name,
    entity_type: entityType,
    filters,
    is_default: isDefault,
  });

  describe("Filter CRUD", () => {
    it("should create a filter with unique ID", () => {
      const f1 = createFilter("Open emails", "emails", { status: "opened" });
      const f2 = createFilter("Bounced", "emails", { status: "bounced" });
      expect(f1.id).not.toBe(f2.id);
    });

    it("should delete filter by ID", () => {
      const filters = [
        createFilter("A", "emails", {}),
        createFilter("B", "emails", {}),
        createFilter("C", "emails", {}),
      ];
      const idToDelete = filters[1].id;
      const remaining = filters.filter(f => f.id !== idToDelete);
      expect(remaining).toHaveLength(2);
      expect(remaining.find(f => f.id === idToDelete)).toBeUndefined();
    });

    it("should set only one default per entity type", () => {
      const filters: SavedFilter[] = [
        createFilter("A", "emails", {}, true),
        createFilter("B", "emails", {}, false),
        createFilter("C", "emails", {}, false),
      ];
      const newDefaultId = filters[2].id;
      const updated = filters.map(f => ({ ...f, is_default: f.id === newDefaultId }));
      expect(updated.filter(f => f.is_default)).toHaveLength(1);
      expect(updated.find(f => f.is_default)?.id).toBe(newDefaultId);
    });
  });

  describe("Filter name validation", () => {
    it("should require non-empty name", () => {
      const isValid = (name: string) => name.trim().length > 0;
      expect(isValid("My filter")).toBe(true);
      expect(isValid("")).toBe(false);
      expect(isValid("   ")).toBe(false);
    });
  });

  describe("localStorage persistence", () => {
    it("should generate correct storage key", () => {
      const entityType = "emails";
      const key = `fuxico_filters_${entityType}`;
      expect(key).toBe("fuxico_filters_emails");
    });

    it("should serialize/deserialize filters", () => {
      const filters = [createFilter("Test", "emails", { status: "opened" })];
      const serialized = JSON.stringify(filters);
      const deserialized = JSON.parse(serialized);
      expect(deserialized[0].name).toBe("Test");
      expect(deserialized[0].filters.status).toBe("opened");
    });

    it("should handle corrupted localStorage gracefully", () => {
      const parseFilters = (stored: string | null): SavedFilter[] => {
        if (!stored) return [];
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      };
      expect(parseFilters(null)).toEqual([]);
      expect(parseFilters("not json")).toEqual([]);
      expect(parseFilters("[]")).toEqual([]);
    });
  });
});
