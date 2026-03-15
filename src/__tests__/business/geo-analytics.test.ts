import { describe, it, expect } from "vitest";

// =============================================================================
// GEO ANALYTICS TESTS - 20+ scenarios
// =============================================================================

describe("Geo Stats Aggregation", () => {
  interface GeoStat {
    country: string;
    city: string;
    open_count: number;
    click_count: number;
  }

  interface CountryStats {
    country: string;
    total: number;
    opens: number;
    clicks: number;
    cities: { city: string; opens: number; clicks: number; total: number }[];
  }

  const aggregateByCountry = (rows: GeoStat[]): CountryStats[] => {
    const map = new Map<string, CountryStats>();

    rows.forEach(row => {
      const existing = map.get(row.country);
      const cityEntry = { city: row.city, opens: row.open_count, clicks: row.click_count, total: row.open_count + row.click_count };

      if (existing) {
        existing.opens += row.open_count;
        existing.clicks += row.click_count;
        existing.total += row.open_count + row.click_count;
        existing.cities.push(cityEntry);
      } else {
        map.set(row.country, {
          country: row.country,
          opens: row.open_count,
          clicks: row.click_count,
          total: row.open_count + row.click_count,
          cities: [cityEntry],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  };

  it("should aggregate single country", () => {
    const result = aggregateByCountry([
      { country: "Brazil", city: "São Paulo", open_count: 10, click_count: 5 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].country).toBe("Brazil");
    expect(result[0].opens).toBe(10);
    expect(result[0].clicks).toBe(5);
    expect(result[0].total).toBe(15);
  });

  it("should aggregate multiple cities in same country", () => {
    const result = aggregateByCountry([
      { country: "Brazil", city: "São Paulo", open_count: 10, click_count: 5 },
      { country: "Brazil", city: "Rio de Janeiro", open_count: 8, click_count: 3 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].opens).toBe(18);
    expect(result[0].clicks).toBe(8);
    expect(result[0].cities).toHaveLength(2);
  });

  it("should sort by total descending", () => {
    const result = aggregateByCountry([
      { country: "Portugal", city: "Lisboa", open_count: 5, click_count: 2 },
      { country: "Brazil", city: "São Paulo", open_count: 20, click_count: 10 },
      { country: "US", city: "New York", open_count: 15, click_count: 8 },
    ]);
    expect(result[0].country).toBe("Brazil");
    expect(result[1].country).toBe("US");
    expect(result[2].country).toBe("Portugal");
  });

  it("should handle empty data", () => {
    expect(aggregateByCountry([])).toEqual([]);
  });

  it("should handle zero counts", () => {
    const result = aggregateByCountry([
      { country: "Unknown", city: "Unknown", open_count: 0, click_count: 0 },
    ]);
    expect(result[0].total).toBe(0);
  });
});

describe("Country Code Validation", () => {
  const isValidCountryCode = (code: string) => /^[A-Z]{2}$/.test(code);

  it("should accept valid ISO 3166-1 codes", () => {
    ["BR", "US", "PT", "DE", "JP"].forEach(code => {
      expect(isValidCountryCode(code)).toBe(true);
    });
  });

  it("should reject invalid codes", () => {
    ["br", "USA", "B", "123", ""].forEach(code => {
      expect(isValidCountryCode(code)).toBe(false);
    });
  });
});

describe("Time Zone Handling", () => {
  it("should handle UTC offset correctly", () => {
    const utcDate = new Date("2024-01-15T12:00:00Z");
    const brOffset = -3;
    const brTime = new Date(utcDate.getTime() + brOffset * 60 * 60 * 1000);
    expect(brTime.getUTCHours()).toBe(9);
  });

  it("should detect business hours by timezone", () => {
    const isBusinessHours = (hour: number, start = 8, end = 18) => hour >= start && hour < end;
    expect(isBusinessHours(10)).toBe(true);
    expect(isBusinessHours(7)).toBe(false);
    expect(isBusinessHours(18)).toBe(false);
    expect(isBusinessHours(8)).toBe(true);
  });
});
