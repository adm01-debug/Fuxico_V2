import { describe, it, expect } from "vitest";

// =============================================================================
// INPUT VALIDATION & INJECTION PREVENTION - 25+ scenarios
// =============================================================================

describe("Input Validation & Injection Prevention", () => {
  describe("SQL injection prevention", () => {
    const hasSqlInjection = (input: string): boolean => {
      const patterns = [
        /['";].*(--)/, /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC)\b)/i,
        /(\bOR\b\s+\d+\s*=\s*\d+)/i, /(\bAND\b\s+\d+\s*=\s*\d+)/i,
        /(\bUNION\b\s+\bSELECT\b)/i,
      ];
      return patterns.some(p => p.test(input));
    };

    it("should detect basic SQL injection", () => {
      expect(hasSqlInjection("'; DROP TABLE users; --")).toBe(true);
      expect(hasSqlInjection("1 OR 1=1")).toBe(true);
      expect(hasSqlInjection("admin' UNION SELECT * FROM users")).toBe(true);
    });

    it("should allow normal input", () => {
      expect(hasSqlInjection("john@example.com")).toBe(false);
      expect(hasSqlInjection("My email subject")).toBe(false);
      expect(hasSqlInjection("Hello World 123")).toBe(false);
    });
  });

  describe("XSS prevention", () => {
    const hasXss = (input: string): boolean =>
      /<script[\s>]|javascript:|on\w+\s*=/i.test(input);

    it("should detect script tags", () => {
      expect(hasXss('<script>alert("xss")</script>')).toBe(true);
      expect(hasXss("<SCRIPT>alert(1)</SCRIPT>")).toBe(true);
    });

    it("should detect event handlers", () => {
      expect(hasXss('<img onerror="alert(1)">')).toBe(true);
      expect(hasXss('<div onload="alert(1)">')).toBe(true);
    });

    it("should detect javascript: URLs", () => {
      expect(hasXss("javascript:alert(1)")).toBe(true);
    });

    it("should allow safe HTML", () => {
      expect(hasXss("<p>Hello world</p>")).toBe(false);
      expect(hasXss("<b>Bold text</b>")).toBe(false);
    });
  });

  describe("URL validation for tracked links", () => {
    const isValidTrackingUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) return false;
        if (parsed.hostname.length < 3) return false;
        return true;
      } catch {
        return false;
      }
    };

    it("should accept valid URLs", () => {
      expect(isValidTrackingUrl("https://example.com")).toBe(true);
      expect(isValidTrackingUrl("https://sub.domain.com/path?q=1")).toBe(true);
    });

    it("should reject dangerous protocols", () => {
      expect(isValidTrackingUrl("javascript:alert(1)")).toBe(false);
      expect(isValidTrackingUrl("data:text/html,<script>")).toBe(false);
      expect(isValidTrackingUrl("ftp://files.com/file")).toBe(false);
    });

    it("should reject empty/invalid URLs", () => {
      expect(isValidTrackingUrl("")).toBe(false);
      expect(isValidTrackingUrl("not-a-url")).toBe(false);
    });
  });

  describe("Email address validation", () => {
    const validateRecipient = (email: string): { valid: boolean; error?: string } => {
      if (!email) return { valid: false, error: "Email is required" };
      if (email.length > 254) return { valid: false, error: "Email too long" };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: "Invalid format" };
      return { valid: true };
    };

    it("should accept valid emails", () => {
      expect(validateRecipient("user@example.com").valid).toBe(true);
    });

    it("should reject empty email", () => {
      expect(validateRecipient("").valid).toBe(false);
    });

    it("should reject emails without @", () => {
      expect(validateRecipient("invalid-email").valid).toBe(false);
    });

    it("should reject overly long emails", () => {
      expect(validateRecipient("a".repeat(250) + "@b.com").valid).toBe(false);
    });

    it("should provide error messages", () => {
      expect(validateRecipient("").error).toBe("Email is required");
      expect(validateRecipient("bad").error).toBe("Invalid format");
    });
  });

  describe("Webhook URL validation", () => {
    const isValidWebhookUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:";
      } catch {
        return false;
      }
    };

    it("should require HTTPS for webhooks", () => {
      expect(isValidWebhookUrl("https://hooks.slack.com/abc")).toBe(true);
      expect(isValidWebhookUrl("http://insecure.com/hook")).toBe(false);
    });

    it("should reject invalid webhook URLs", () => {
      expect(isValidWebhookUrl("not-a-url")).toBe(false);
      expect(isValidWebhookUrl("")).toBe(false);
    });
  });
});
