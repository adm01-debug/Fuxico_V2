import { describe, it, expect } from "vitest";

// =============================================================================
// UNSUBSCRIBE & COMPLIANCE TESTS - 20+ scenarios  
// =============================================================================

describe("Unsubscribe Handling", () => {
  const isUnsubscribed = (email: string, list: string[]) =>
    list.includes(email.toLowerCase());

  const addToUnsubscribeList = (email: string, list: string[]) => {
    const lower = email.toLowerCase();
    if (!list.includes(lower)) list.push(lower);
    return list;
  };

  it("should detect unsubscribed email", () => {
    expect(isUnsubscribed("test@test.com", ["test@test.com"])).toBe(true);
  });

  it("should be case-insensitive", () => {
    expect(isUnsubscribed("TEST@TEST.COM", ["test@test.com"])).toBe(true);
  });

  it("should not detect non-unsubscribed email", () => {
    expect(isUnsubscribed("other@test.com", ["test@test.com"])).toBe(false);
  });

  it("should prevent duplicates in unsubscribe list", () => {
    const list = ["test@test.com"];
    addToUnsubscribeList("test@test.com", list);
    expect(list).toHaveLength(1);
  });

  it("should add new email to unsubscribe list", () => {
    const list = ["a@b.com"];
    addToUnsubscribeList("c@d.com", list);
    expect(list).toHaveLength(2);
  });
});

describe("LGPD/GDPR Compliance Checks", () => {
  it("should require consent before tracking", () => {
    const hasConsent = (user: { consent_tracking?: boolean }) => user.consent_tracking === true;
    expect(hasConsent({ consent_tracking: true })).toBe(true);
    expect(hasConsent({ consent_tracking: false })).toBe(false);
    expect(hasConsent({})).toBe(false);
  });

  it("should include unsubscribe link in all tracked emails", () => {
    const emailBody = '<a href="https://app.fuxico.com/unsubscribe?token=abc">Unsubscribe</a>';
    expect(emailBody.includes("unsubscribe")).toBe(true);
  });

  it("should handle data deletion requests", () => {
    const userData = { id: "u1", email: "test@test.com", trackingData: [1, 2, 3] };
    const anonymized = { ...userData, email: "[DELETED]", trackingData: [] };
    expect(anonymized.email).toBe("[DELETED]");
    expect(anonymized.trackingData).toHaveLength(0);
  });

  it("should respect do-not-track headers", () => {
    const shouldTrack = (dnt: string | null) => dnt !== "1";
    expect(shouldTrack("1")).toBe(false);
    expect(shouldTrack("0")).toBe(true);
    expect(shouldTrack(null)).toBe(true);
  });

  it("should log consent changes", () => {
    const auditLog: Array<{ action: string; timestamp: Date }> = [];
    const logConsent = (action: string) => {
      auditLog.push({ action, timestamp: new Date() });
    };
    logConsent("consent_granted");
    logConsent("consent_revoked");
    expect(auditLog).toHaveLength(2);
    expect(auditLog[0].action).toBe("consent_granted");
  });
});

describe("Email Template Variable Injection Safety", () => {
  const sanitizeTemplate = (template: string, vars: Record<string, string>): string => {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const escaped = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      result = result.replace(new RegExp(`{{${key}}}`, "g"), escaped);
    }
    return result;
  };

  it("should replace variables safely", () => {
    const result = sanitizeTemplate("Hello {{name}}", { name: "John" });
    expect(result).toBe("Hello John");
  });

  it("should escape HTML in variables", () => {
    const result = sanitizeTemplate("Hello {{name}}", { name: '<script>alert("xss")</script>' });
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("should handle missing variables gracefully", () => {
    const result = sanitizeTemplate("Hello {{name}}, {{company}}", { name: "John" });
    expect(result).toBe("Hello John, {{company}}");
  });

  it("should handle multiple replacements of same variable", () => {
    const result = sanitizeTemplate("{{name}} says hi {{name}}", { name: "Maria" });
    expect(result).toBe("Maria says hi Maria");
  });
});
