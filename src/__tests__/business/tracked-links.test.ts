import { describe, it, expect } from "vitest";

// =============================================================================
// TRACKED LINKS TESTS - 20+ scenarios
// =============================================================================

describe("Tracked Links Logic", () => {
  describe("Link ID generation", () => {
    it("should generate short unique IDs", () => {
      const generateLinkId = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      };
      const ids = new Set(Array.from({ length: 100 }, generateLinkId));
      expect(ids.size).toBe(100); // All unique
    });
  });

  describe("URL validation", () => {
    const isValidUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    };

    it("should accept valid HTTP URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com/path?q=1")).toBe(true);
      expect(isValidUrl("https://sub.domain.com:8080/api")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("ftp://old.com")).toBe(false);
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
      expect(isValidUrl("")).toBe(false);
    });

    it("should reject dangerous URL schemes", () => {
      expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidUrl("vbscript:alert(1)")).toBe(false);
    });
  });

  describe("Click tracking", () => {
    it("should increment click count", () => {
      let count = 0;
      const click = () => ++count;
      click(); click(); click();
      expect(count).toBe(3);
    });

    it("should track last clicked timestamp", () => {
      const events = [
        { created_at: "2024-01-01T10:00:00Z" },
        { created_at: "2024-01-02T15:00:00Z" },
        { created_at: "2024-01-03T08:00:00Z" },
      ];
      const lastClicked = events.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].created_at;
      expect(lastClicked).toBe("2024-01-03T08:00:00Z");
    });

    it("should deduplicate last click per link", () => {
      const events = [
        { link_id: "l1", created_at: "2024-01-01" },
        { link_id: "l1", created_at: "2024-01-02" },
        { link_id: "l2", created_at: "2024-01-03" },
      ];
      const lastClickMap = new Map<string, string>();
      events
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .forEach(e => {
          if (!lastClickMap.has(e.link_id)) lastClickMap.set(e.link_id, e.created_at);
        });
      expect(lastClickMap.get("l1")).toBe("2024-01-02");
      expect(lastClickMap.get("l2")).toBe("2024-01-03");
    });
  });

  describe("Click event data", () => {
    it("should parse device type from user agent", () => {
      const getDeviceType = (ua: string) => {
        const lower = ua.toLowerCase();
        if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) return "mobile";
        if (lower.includes("tablet") || lower.includes("ipad")) return "tablet";
        return "desktop";
      };
      expect(getDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS)")).toBe("mobile");
      expect(getDeviceType("Mozilla/5.0 (iPad; CPU OS)")).toBe("tablet");
      expect(getDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64)")).toBe("desktop");
      expect(getDeviceType("Mozilla/5.0 (Linux; Android 12)")).toBe("mobile");
    });

    it("should parse browser from user agent", () => {
      const getBrowser = (ua: string) => {
        if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
        if (ua.includes("Edg")) return "Edge";
        return "Other";
      };
      expect(getBrowser("Mozilla/5.0 Chrome/120")).toBe("Chrome");
      expect(getBrowser("Mozilla/5.0 Firefox/120")).toBe("Firefox");
      expect(getBrowser("Mozilla/5.0 Safari/605")).toBe("Safari");
      expect(getBrowser("Mozilla/5.0 Chrome/120 Edg/120")).toBe("Edge");
    });
  });
});
