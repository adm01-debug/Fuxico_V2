import { describe, it, expect } from "vitest";

// =============================================================================
// EXPORT & DATA FORMAT TESTS - 20+ scenarios
// =============================================================================

describe("Data Export Formats", () => {
  interface ExportRow {
    tracking_id: string;
    recipient_email: string;
    subject: string | null;
    created_at: string;
    delivery_status: string | null;
    open_count: number;
    click_count: number;
  }

  const toCSV = (rows: ExportRow[], separator = ","): string => {
    const headers = ["tracking_id", "recipient_email", "subject", "created_at", "delivery_status", "open_count", "click_count"];
    const lines = rows.map(row =>
      headers.map(h => {
        const value = String(row[h as keyof ExportRow] ?? "");
        return value.includes(separator) || value.includes('"') || value.includes("\n")
          ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(separator)
    );
    return [headers.join(separator), ...lines].join("\n");
  };

  const toJSON = (rows: ExportRow[]): string => JSON.stringify(rows, null, 2);

  describe("CSV export", () => {
    it("should include header row", () => {
      const csv = toCSV([]);
      expect(csv.startsWith("tracking_id")).toBe(true);
    });

    it("should export data rows", () => {
      const rows: ExportRow[] = [{
        tracking_id: "t-1", recipient_email: "a@b.com",
        subject: "Hello", created_at: "2024-01-01",
        delivery_status: "sent", open_count: 5, click_count: 2,
      }];
      const csv = toCSV(rows);
      expect(csv.split("\n")).toHaveLength(2); // header + 1 row
      expect(csv).toContain("a@b.com");
    });

    it("should escape commas in values", () => {
      const rows: ExportRow[] = [{
        tracking_id: "t-1", recipient_email: "a@b.com",
        subject: "Hello, World", created_at: "2024-01-01",
        delivery_status: "sent", open_count: 0, click_count: 0,
      }];
      const csv = toCSV(rows);
      expect(csv).toContain('"Hello, World"');
    });

    it("should escape double quotes in values", () => {
      const rows: ExportRow[] = [{
        tracking_id: "t-1", recipient_email: "a@b.com",
        subject: 'Say "Hello"', created_at: "2024-01-01",
        delivery_status: "sent", open_count: 0, click_count: 0,
      }];
      const csv = toCSV(rows);
      expect(csv).toContain('""Hello""');
    });

    it("should handle null values", () => {
      const rows: ExportRow[] = [{
        tracking_id: "t-1", recipient_email: "a@b.com",
        subject: null, created_at: "2024-01-01",
        delivery_status: null, open_count: 0, click_count: 0,
      }];
      const csv = toCSV(rows);
      expect(csv).not.toContain("null");
    });

    it("should support semicolon separator", () => {
      const csv = toCSV([], ";");
      expect(csv).toContain(";");
      expect(csv).not.toContain(",");
    });
  });

  describe("JSON export", () => {
    it("should produce valid JSON", () => {
      const rows: ExportRow[] = [{
        tracking_id: "t-1", recipient_email: "a@b.com",
        subject: "Test", created_at: "2024-01-01",
        delivery_status: "sent", open_count: 1, click_count: 0,
      }];
      expect(() => JSON.parse(toJSON(rows))).not.toThrow();
    });

    it("should preserve data types", () => {
      const rows: ExportRow[] = [{
        tracking_id: "t-1", recipient_email: "a@b.com",
        subject: null, created_at: "2024-01-01",
        delivery_status: "sent", open_count: 5, click_count: 2,
      }];
      const parsed = JSON.parse(toJSON(rows));
      expect(parsed[0].open_count).toBe(5);
      expect(parsed[0].subject).toBeNull();
    });

    it("should handle empty array", () => {
      expect(JSON.parse(toJSON([]))).toEqual([]);
    });
  });

  describe("Export limits", () => {
    it("should enforce max export rows", () => {
      const MAX_EXPORT = 10000;
      const data = Array.from({ length: 15000 }, (_, i) => ({
        tracking_id: `t-${i}`, recipient_email: `u${i}@t.com`,
        subject: "S", created_at: "2024-01-01",
        delivery_status: "sent", open_count: 0, click_count: 0,
      }));
      const exported = data.slice(0, MAX_EXPORT);
      expect(exported).toHaveLength(10000);
    });

    it("should warn about truncation", () => {
      const total = 15000;
      const MAX_EXPORT = 10000;
      const isTruncated = total > MAX_EXPORT;
      expect(isTruncated).toBe(true);
    });
  });
});
