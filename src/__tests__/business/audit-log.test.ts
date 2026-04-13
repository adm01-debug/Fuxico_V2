import { describe, it, expect } from "vitest";

// =============================================================================
// AUDIT LOG TESTS - 20+ scenarios  
// =============================================================================

describe("Email Audit Log", () => {
  // AuditEntry: direction, sender_email, recipient_email, subject, is_external, external_domain, timestamp

  const isExternalEmail = (email: string, internalDomains: string[]): boolean => {
    const domain = email.split("@")[1]?.toLowerCase();
    return !internalDomains.includes(domain);
  };

  const extractDomain = (email: string): string | null => {
    const parts = email.split("@");
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  };

  const isOutsideBusinessHours = (timestamp: string, start = 8, end = 18): boolean => {
    const hour = new Date(timestamp).getHours();
    return hour < start || hour >= end;
  };

  describe("External email detection", () => {
    const internalDomains = ["company.com", "company.com.br"];

    it("should detect external emails", () => {
      expect(isExternalEmail("user@gmail.com", internalDomains)).toBe(true);
    });

    it("should detect internal emails", () => {
      expect(isExternalEmail("user@company.com", internalDomains)).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isExternalEmail("User@COMPANY.COM", internalDomains)).toBe(false);
    });

    it("should handle multiple internal domains", () => {
      expect(isExternalEmail("user@company.com.br", internalDomains)).toBe(false);
    });
  });

  describe("Domain extraction", () => {
    it("should extract domain from email", () => {
      expect(extractDomain("user@example.com")).toBe("example.com");
    });

    it("should lowercase domain", () => {
      expect(extractDomain("User@EXAMPLE.COM")).toBe("example.com");
    });

    it("should return null for invalid email", () => {
      expect(extractDomain("not-an-email")).toBeNull();
    });
  });

  describe("Business hours detection", () => {
    it("should detect after-hours activity", () => {
      expect(isOutsideBusinessHours("2024-01-15T23:00:00")).toBe(true);
      expect(isOutsideBusinessHours("2024-01-15T05:00:00")).toBe(true);
    });

    it("should detect business hours activity", () => {
      expect(isOutsideBusinessHours("2024-01-15T10:00:00")).toBe(false);
      expect(isOutsideBusinessHours("2024-01-15T14:00:00")).toBe(false);
    });

    it("should handle boundary hours", () => {
      expect(isOutsideBusinessHours("2024-01-15T08:00:00")).toBe(false); // 8am = business
      expect(isOutsideBusinessHours("2024-01-15T18:00:00")).toBe(true);  // 6pm = after
    });

    it("should support custom business hours", () => {
      expect(isOutsideBusinessHours("2024-01-15T06:00:00", 6, 22)).toBe(false);
      expect(isOutsideBusinessHours("2024-01-15T22:00:00", 6, 22)).toBe(true);
    });
  });

  describe("Volume anomaly detection", () => {
    const isAnomalous = (count: number, hourlyThreshold: number, dailyThreshold: number, period: "hourly" | "daily") => {
      const threshold = period === "hourly" ? hourlyThreshold : dailyThreshold;
      return count > threshold;
    };

    it("should detect hourly volume anomaly", () => {
      expect(isAnomalous(150, 100, 1000, "hourly")).toBe(true);
      expect(isAnomalous(50, 100, 1000, "hourly")).toBe(false);
    });

    it("should detect daily volume anomaly", () => {
      expect(isAnomalous(1500, 100, 1000, "daily")).toBe(true);
      expect(isAnomalous(500, 100, 1000, "daily")).toBe(false);
    });
  });

  describe("Fraud alert generation", () => {
    type AlertSeverity = "low" | "medium" | "high" | "critical";
    type AlertType = "unusual_volume" | "after_hours" | "external_domain" | "data_exfiltration";

    const generateAlert = (type: AlertType, count: number): { severity: AlertSeverity; description: string } => {
      if (type === "data_exfiltration") return { severity: "critical", description: `Suspected data exfiltration: ${count} external emails` };
      if (type === "unusual_volume" && count > 500) return { severity: "high", description: `Unusual volume: ${count} emails` };
      if (type === "unusual_volume") return { severity: "medium", description: `Elevated volume: ${count} emails` };
      if (type === "after_hours") return { severity: "low", description: `After-hours activity detected` };
      return { severity: "low", description: `External domain activity` };
    };

    it("should generate critical alert for data exfiltration", () => {
      expect(generateAlert("data_exfiltration", 100).severity).toBe("critical");
    });

    it("should generate high alert for extreme volume", () => {
      expect(generateAlert("unusual_volume", 600).severity).toBe("high");
    });

    it("should generate medium alert for elevated volume", () => {
      expect(generateAlert("unusual_volume", 200).severity).toBe("medium");
    });

    it("should generate low alert for after-hours", () => {
      expect(generateAlert("after_hours", 1).severity).toBe("low");
    });
  });
});
