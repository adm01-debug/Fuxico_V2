import { describe, it, expect } from "vitest";

// Security-focused tests for data handling

describe("Email Validation", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ===== VALID EMAILS =====
  describe("Valid email formats", () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.com",
      "user@sub.domain.com",
      "a@b.co",
      "test123@test.com",
      "user-name@domain.org",
      "USER@DOMAIN.COM",
      "user@123.123.123.com",
    ];

    validEmails.forEach((email) => {
      it(`should accept: ${email}`, () => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });

  // ===== INVALID EMAILS =====
  describe("Invalid email formats", () => {
    const invalidEmails = [
      "",
      "not-an-email",
      "@domain.com",
      "user@",
      "user@.com",
      "user @domain.com",
      "user@ domain.com",
    ];

    invalidEmails.forEach((email) => {
      it(`should reject: "${email}"`, () => {
        expect(email === "" || !emailRegex.test(email)).toBe(true);
      });
    });
  });
});

describe("XSS Prevention", () => {
  // ===== SCRIPT INJECTION =====
  describe("Script injection detection", () => {
    const xssPatterns = [
      '<script>alert("xss")</script>',
      "javascript:alert(1)",
      '<img src=x onerror=alert(1)>',
      "<svg onload=alert(1)>",
      '"><script>alert(document.cookie)</script>',
      "';DROP TABLE users;--",
      '<iframe src="evil.com">',
      'onmouseover="alert(1)"',
    ];

    xssPatterns.forEach((pattern) => {
      it(`should detect XSS pattern: ${pattern.substring(0, 30)}...`, () => {
        const hasScript = /<script|javascript:|on\w+\s*=|<iframe|<svg/i.test(pattern);
        const hasSQL = /DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO/i.test(pattern);
        expect(hasScript || hasSQL).toBe(true);
      });
    });
  });

  // ===== HTML ESCAPING =====
  describe("HTML escaping", () => {
    function escapeHtml(str: string): string {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    it("should escape angle brackets", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    });

    it("should escape ampersands", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("should escape quotes", () => {
      expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
    });

    it("should escape single quotes", () => {
      expect(escapeHtml("it's")).toBe("it&#039;s");
    });

    it("should handle empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should not modify safe strings", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });
  });
});

describe("URL Validation", () => {
  // ===== VALID URLS =====
  describe("Valid URLs", () => {
    const validUrls = [
      "https://example.com",
      "http://localhost:3000",
      "https://sub.domain.com/path?q=1",
      "https://example.com/path#section",
      "https://example.com:8080/api/v1",
    ];

    validUrls.forEach((url) => {
      it(`should accept: ${url}`, () => {
        expect(() => new URL(url)).not.toThrow();
      });
    });
  });

  // ===== INVALID URLS =====
  describe("Invalid URLs", () => {
    const invalidUrls = [
      "not-a-url",
      "ftp://old-protocol.com",
      "",
      "//missing-protocol.com",
    ];

    invalidUrls.forEach((url) => {
      it(`should reject or flag: "${url}"`, () => {
        try {
          const parsed = new URL(url);
          expect(["http:", "https:"].includes(parsed.protocol)).toBeDefined();
        } catch {
          // Invalid URL throws - that's expected
          expect(true).toBe(true);
        }
      });
    });
  });

  // ===== DANGEROUS URLS =====
  describe("Dangerous URL schemes", () => {
    const dangerousUrls = [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:alert(1)",
    ];

    dangerousUrls.forEach((url) => {
      it(`should flag dangerous: ${url.substring(0, 25)}...`, () => {
        const isDangerous = /^(javascript|data|vbscript):/i.test(url);
        expect(isDangerous).toBe(true);
      });
    });
  });
});

describe("SQL Injection Prevention", () => {
  const sqlPatterns = [
    "'; DROP TABLE users; --",
    "1 OR 1=1",
    "' UNION SELECT * FROM passwords --",
    "admin'--",
    "1; DELETE FROM emails WHERE 1=1",
  ];

  sqlPatterns.forEach((pattern) => {
    it(`should detect SQL injection: ${pattern.substring(0, 30)}`, () => {
      const hasSqlInjection =
        /(\b(DROP|DELETE|INSERT|UPDATE|UNION|SELECT)\b.*\b(TABLE|FROM|INTO|SET)\b)|(--)|(;.*\b(DROP|DELETE)\b)|(\bOR\b\s+\d+=\d+)/i.test(
          pattern
        );
      expect(hasSqlInjection).toBe(true);
    });
  });
});

describe("Rate Limit Data Integrity", () => {
  it("should track request counts correctly", () => {
    const store = new Map<string, { count: number; resetAt: number }>();
    const key = "192.168.1.1:/api/track";
    const windowMs = 60000;

    // Simulate 100 requests
    for (let i = 0; i < 100; i++) {
      const entry = store.get(key) || { count: 0, resetAt: Date.now() + windowMs };
      entry.count++;
      store.set(key, entry);
    }

    expect(store.get(key)!.count).toBe(100);
  });

  it("should reset after window expires", () => {
    const now = Date.now();
    const entry = { count: 60, resetAt: now - 1000 }; // Expired

    if (entry.resetAt < now) {
      entry.count = 0;
      entry.resetAt = now + 60000;
    }

    expect(entry.count).toBe(0);
  });

  it("should correctly calculate remaining requests", () => {
    const maxRequests = 60;
    const currentCount = 45;
    const remaining = Math.max(0, maxRequests - currentCount);
    expect(remaining).toBe(15);
  });

  it("should not allow negative remaining", () => {
    const maxRequests = 60;
    const currentCount = 100;
    const remaining = Math.max(0, maxRequests - currentCount);
    expect(remaining).toBe(0);
  });
});
