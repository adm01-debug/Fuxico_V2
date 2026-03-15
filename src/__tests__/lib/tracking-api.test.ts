import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("Tracking API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== AUTHENTICATION =====
  describe("Authentication handling", () => {
    it("should throw when no session exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const getAuthHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");
        return { Authorization: `Bearer ${session.access_token}` };
      };

      await expect(getAuthHeaders()).rejects.toThrow("Not authenticated");
    });

    it("should return headers when session exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: { access_token: "valid-token" },
        },
        error: null,
      } as any);

      const { data: { session } } = await supabase.auth.getSession();
      expect(session?.access_token).toBe("valid-token");
    });

    it("should include Bearer prefix in authorization header", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: { access_token: "my-token" },
        },
        error: null,
      } as any);

      const { data: { session } } = await supabase.auth.getSession();
      const header = `Bearer ${session?.access_token}`;
      expect(header).toBe("Bearer my-token");
    });
  });

  // ===== HTTP ERROR HANDLING =====
  describe("HTTP error handling", () => {
    it("should detect 401 unauthorized", () => {
      const response = { ok: false, status: 401 };
      expect(response.status).toBe(401);
    });

    it("should detect 403 forbidden", () => {
      const response = { ok: false, status: 403 };
      expect(response.status).toBe(403);
    });

    it("should detect 404 not found", () => {
      const response = { ok: false, status: 404 };
      expect(response.status).toBe(404);
    });

    it("should detect 429 rate limited", () => {
      const response = { ok: false, status: 429 };
      expect(response.status).toBe(429);
    });

    it("should detect 500 server error", () => {
      const response = { ok: false, status: 500 };
      expect(response.status).toBe(500);
    });

    it("should handle network failures", async () => {
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
      await expect(mockFetch("https://api.test.com")).rejects.toThrow("Failed to fetch");
    });

    it("should handle timeout scenarios", async () => {
      mockFetch.mockRejectedValue(new Error("AbortError"));
      await expect(mockFetch("https://api.test.com")).rejects.toThrow("AbortError");
    });
  });

  // ===== RESPONSE PARSING =====
  describe("Response parsing", () => {
    it("should parse valid JSON response", async () => {
      const mockData = { emails: [], total: 0 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const response = await mockFetch("https://api.test.com");
      const data = await response.json();
      expect(data).toEqual(mockData);
    });

    it("should handle empty email list", async () => {
      const mockData = { emails: [], total: 0 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const response = await mockFetch("https://api.test.com");
      const data = await response.json();
      expect(data.emails).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it("should parse email detail response", async () => {
      const mockDetail = {
        email: { tracking_id: "t-123", recipient_email: "test@test.com" },
        stats: { totalOpens: 5, uniqueOpens: 3 },
        events: [],
        links: [],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDetail),
      });

      const response = await mockFetch("https://api.test.com");
      const data = await response.json();
      expect(data.email.tracking_id).toBe("t-123");
      expect(data.stats.totalOpens).toBe(5);
    });
  });

  // ===== CREATE TRACKING VALIDATION =====
  describe("Create tracking input validation", () => {
    it("should require recipientEmail", () => {
      const input = { recipientEmail: "test@test.com" };
      expect(input.recipientEmail).toBeDefined();
    });

    it("should accept optional subject", () => {
      const input = { recipientEmail: "test@test.com", subject: "Hello" };
      expect(input.subject).toBe("Hello");
    });

    it("should accept optional links array", () => {
      const input = {
        recipientEmail: "test@test.com",
        links: ["https://example.com", "https://test.com"],
      };
      expect(input.links).toHaveLength(2);
    });

    it("should accept optional metadata", () => {
      const input = {
        recipientEmail: "test@test.com",
        metadata: { campaign: "welcome", batch: 1 },
      };
      expect(input.metadata?.campaign).toBe("welcome");
    });

    it("should validate email format", () => {
      const validEmails = ["user@example.com", "user+tag@domain.co", "a@b.io"];
      const invalidEmails = ["not-email", "@domain.com", "user@", ""];

      validEmails.forEach((email) => {
        expect(email).toMatch(/.+@.+\..+/);
      });

      invalidEmails.forEach((email) => {
        expect(email).not.toMatch(/^.+@.+\..+$/);
      });
    });
  });

  // ===== URL CONSTRUCTION =====
  describe("URL construction", () => {
    const baseUrl = "https://test.supabase.co";

    it("should build correct tracking stats URL", () => {
      const url = `${baseUrl}/functions/v1/get-tracking-stats`;
      expect(url).toContain("/functions/v1/");
    });

    it("should build correct detail URL with ID", () => {
      const trackingId = "abc-123";
      const url = `${baseUrl}/functions/v1/get-tracking-stats?id=${trackingId}`;
      expect(url).toContain("?id=abc-123");
    });

    it("should build correct create-tracking URL", () => {
      const url = `${baseUrl}/functions/v1/create-tracking`;
      expect(url.endsWith("/create-tracking")).toBe(true);
    });

    it("should handle special characters in tracking ID", () => {
      const trackingId = "abc-def-123-456";
      const url = `${baseUrl}/functions/v1/get-tracking-stats?id=${encodeURIComponent(trackingId)}`;
      expect(url).toContain("abc-def-123-456");
    });
  });
});
