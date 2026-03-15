import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn() - Utility function", () => {
  // ===== BASIC FUNCTIONALITY =====
  describe("Basic class merging", () => {
    it("should merge single class", () => {
      expect(cn("text-red-500")).toBe("text-red-500");
    });

    it("should merge multiple classes", () => {
      expect(cn("p-4", "m-2", "flex")).toBe("p-4 m-2 flex");
    });

    it("should handle empty strings", () => {
      expect(cn("", "p-4", "")).toBe("p-4");
    });

    it("should handle no arguments", () => {
      expect(cn()).toBe("");
    });

    it("should handle undefined values", () => {
      expect(cn("p-4", undefined, "m-2")).toBe("p-4 m-2");
    });

    it("should handle null values", () => {
      expect(cn("p-4", null, "m-2")).toBe("p-4 m-2");
    });

    it("should handle false values", () => {
      expect(cn("p-4", false, "m-2")).toBe("p-4 m-2");
    });

    it("should handle 0 value", () => {
      expect(cn("p-4", 0, "m-2")).toBe("p-4 m-2");
    });
  });

  // ===== TAILWIND MERGE =====
  describe("Tailwind class conflict resolution", () => {
    it("should resolve padding conflicts (last wins)", () => {
      expect(cn("p-4", "p-8")).toBe("p-8");
    });

    it("should resolve margin conflicts", () => {
      expect(cn("m-2", "m-4")).toBe("m-4");
    });

    it("should resolve text color conflicts", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should resolve background color conflicts", () => {
      expect(cn("bg-white", "bg-black")).toBe("bg-black");
    });

    it("should resolve font size conflicts", () => {
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    it("should resolve width conflicts", () => {
      expect(cn("w-full", "w-1/2")).toBe("w-1/2");
    });

    it("should NOT conflict different axes (px vs py)", () => {
      const result = cn("px-4", "py-2");
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });

    it("should resolve display conflicts", () => {
      expect(cn("block", "flex")).toBe("flex");
    });

    it("should resolve flex direction conflicts", () => {
      expect(cn("flex-row", "flex-col")).toBe("flex-col");
    });

    it("should resolve border radius conflicts", () => {
      expect(cn("rounded", "rounded-lg")).toBe("rounded-lg");
    });
  });

  // ===== CONDITIONAL CLASSES =====
  describe("Conditional class application", () => {
    it("should apply class conditionally with boolean", () => {
      const isActive = true;
      expect(cn("base", isActive && "active")).toBe("base active");
    });

    it("should skip class when condition is false", () => {
      const isActive = false;
      expect(cn("base", isActive && "active")).toBe("base");
    });

    it("should handle ternary expressions", () => {
      const isOpen = true;
      expect(cn("base", isOpen ? "open" : "closed")).toBe("base open");
    });

    it("should handle complex conditionals", () => {
      const variant = "primary";
      expect(
        cn(
          "base",
          variant === "primary" && "bg-primary",
          variant === "secondary" && "bg-secondary"
        )
      ).toBe("base bg-primary");
    });
  });

  // ===== OBJECT SYNTAX =====
  describe("Object syntax (clsx feature)", () => {
    it("should apply classes from object with true values", () => {
      expect(cn({ "p-4": true, "m-2": true })).toBe("p-4 m-2");
    });

    it("should skip classes from object with false values", () => {
      expect(cn({ "p-4": true, "m-2": false })).toBe("p-4");
    });

    it("should mix string and object syntax", () => {
      expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });
  });

  // ===== ARRAY SYNTAX =====
  describe("Array syntax", () => {
    it("should flatten arrays of classes", () => {
      expect(cn(["p-4", "m-2"])).toBe("p-4 m-2");
    });

    it("should handle nested arrays", () => {
      expect(cn(["p-4", ["m-2", "flex"]])).toBe("p-4 m-2 flex");
    });
  });

  // ===== EDGE CASES =====
  describe("Edge cases", () => {
    it("should handle very long class strings", () => {
      const classes = Array.from({ length: 50 }, (_, i) => `class-${i}`).join(" ");
      expect(cn(classes)).toBeTruthy();
    });

    it("should handle duplicate classes", () => {
      const result = cn("p-4", "p-4");
      expect(result).toBe("p-4");
    });

    it("should handle arbitrary values", () => {
      expect(cn("w-[100px]", "h-[200px]")).toBe("w-[100px] h-[200px]");
    });

    it("should handle responsive prefixes", () => {
      const result = cn("p-2", "md:p-4", "lg:p-8");
      expect(result).toContain("p-2");
      expect(result).toContain("md:p-4");
      expect(result).toContain("lg:p-8");
    });

    it("should handle hover states", () => {
      expect(cn("hover:bg-blue-500", "hover:bg-red-500")).toBe("hover:bg-red-500");
    });

    it("should handle dark mode classes", () => {
      const result = cn("bg-white", "dark:bg-black");
      expect(result).toContain("bg-white");
      expect(result).toContain("dark:bg-black");
    });
  });
});
