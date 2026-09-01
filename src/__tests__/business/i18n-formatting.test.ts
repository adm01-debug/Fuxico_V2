import { describe, it, expect } from "vitest";

// =============================================================================
// I18N FORMATTING TESTS - 20+ scenarios
// =============================================================================

describe("Date Formatting i18n", () => {
  const formatDate = (date: string | Date, locale: string): string => {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric", month: "long", day: "numeric",
    }).format(new Date(date));
  };

  const formatRelativeTime = (date: Date, now = new Date()): string => {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 30) return `${diffDays}d atrás`;
    return `${Math.floor(diffDays / 30)}m atrás`;
  };

  it("should format date in pt-BR", () => {
    const result = formatDate("2024-06-15", "pt-BR");
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });

  it("should format date in en-US", () => {
    const result = formatDate("2024-06-15", "en-US");
    expect(result).toContain("June");
    expect(result).toContain("15");
  });

  it("should format date in es", () => {
    const result = formatDate("2024-06-15", "es");
    expect(result).toContain("2024");
  });

  it("should handle relative time 'now'", () => {
    expect(formatRelativeTime(new Date())).toBe("agora");
  });

  it("should handle relative time minutes", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    expect(formatRelativeTime(fiveMinAgo)).toBe("5min atrás");
  });

  it("should handle relative time hours", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h atrás");
  });

  it("should handle relative time days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d atrás");
  });
});

describe("Number Formatting i18n", () => {
  const formatNumber = (num: number, locale: string): string => {
    return new Intl.NumberFormat(locale).format(num);
  };

  const formatPercent = (num: number, locale: string): string => {
    return new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 1 }).format(num / 100);
  };

  const formatCompact = (num: number, locale: string): string => {
    return new Intl.NumberFormat(locale, { notation: "compact" }).format(num);
  };

  it("should format numbers in pt-BR", () => {
    const result = formatNumber(1234567.89, "pt-BR");
    expect(result).toContain("1.234.567");
  });

  it("should format numbers in en-US", () => {
    const result = formatNumber(1234567.89, "en-US");
    expect(result).toContain("1,234,567");
  });

  it("should format percentages", () => {
    const result = formatPercent(45.5, "pt-BR");
    expect(result).toContain("45");
    expect(result).toContain("%");
  });

  it("should format compact numbers", () => {
    const result = formatCompact(1500000, "en-US");
    expect(result).toMatch(/1\.?5?M/);
  });

  it("should handle zero", () => {
    expect(formatNumber(0, "pt-BR")).toBe("0");
  });

  it("should handle negative numbers", () => {
    const result = formatNumber(-1234, "en-US");
    expect(result).toContain("-");
    expect(result).toContain("1,234");
  });
});

describe("Currency Formatting", () => {
  const formatCurrency = (amount: number, currency: string, locale: string): string => {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  };

  it("should format BRL", () => {
    const result = formatCurrency(99.90, "BRL", "pt-BR");
    expect(result).toContain("R$");
  });

  it("should format USD", () => {
    const result = formatCurrency(99.90, "USD", "en-US");
    expect(result).toContain("$");
  });

  it("should format EUR", () => {
    const result = formatCurrency(99.90, "EUR", "de-DE");
    expect(result).toContain("€");
  });
});
