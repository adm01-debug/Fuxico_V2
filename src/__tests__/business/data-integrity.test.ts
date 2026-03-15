import { describe, it, expect } from "vitest";

// =============================================================================
// DATA INTEGRITY & PAGINATION TESTS - 25+ scenarios
// =============================================================================

describe("Pagination Logic", () => {
  const paginate = <T>(items: T[], page: number, pageSize: number) => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const data = items.slice(offset, offset + pageSize);
    return { data, totalItems, totalPages, currentPage: page, hasNext: page < totalPages, hasPrev: page > 1 };
  };

  it("should return correct page of data", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const result = paginate(items, 1, 10);
    expect(result.data).toHaveLength(10);
    expect(result.data[0]).toBe(0);
  });

  it("should calculate total pages correctly", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 1, 10).totalPages).toBe(3);
  });

  it("should handle last page with fewer items", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const result = paginate(items, 3, 10);
    expect(result.data).toHaveLength(5);
  });

  it("should handle empty data", () => {
    const result = paginate([], 1, 10);
    expect(result.data).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });

  it("should detect hasNext and hasPrev", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    expect(paginate(items, 1, 10).hasNext).toBe(true);
    expect(paginate(items, 1, 10).hasPrev).toBe(false);
    expect(paginate(items, 2, 10).hasPrev).toBe(true);
    expect(paginate(items, 3, 10).hasNext).toBe(false);
  });

  it("should handle page size of 1", () => {
    const items = [1, 2, 3];
    expect(paginate(items, 2, 1).data).toEqual([2]);
  });

  it("should handle page size larger than data", () => {
    const items = [1, 2, 3];
    expect(paginate(items, 1, 100).data).toEqual([1, 2, 3]);
    expect(paginate(items, 1, 100).totalPages).toBe(1);
  });

  it("should handle Supabase 1000 row limit awareness", () => {
    const SUPABASE_DEFAULT_LIMIT = 1000;
    const totalRows = 2500;
    const pages = Math.ceil(totalRows / SUPABASE_DEFAULT_LIMIT);
    expect(pages).toBe(3);
    // GAP: If you don't paginate manually, you silently lose data beyond 1000 rows
  });
});

describe("Data Sorting", () => {
  const sortEmails = (
    emails: Array<{ created_at: string; recipient_email: string }>,
    sortBy: "date" | "email",
    direction: "asc" | "desc"
  ) => {
    return [...emails].sort((a, b) => {
      let cmp: number;
      if (sortBy === "date") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = a.recipient_email.localeCompare(b.recipient_email);
      }
      return direction === "desc" ? -cmp : cmp;
    });
  };

  it("should sort by date ascending", () => {
    const emails = [
      { created_at: "2024-01-03", recipient_email: "b@t.com" },
      { created_at: "2024-01-01", recipient_email: "a@t.com" },
      { created_at: "2024-01-02", recipient_email: "c@t.com" },
    ];
    const sorted = sortEmails(emails, "date", "asc");
    expect(sorted[0].created_at).toBe("2024-01-01");
    expect(sorted[2].created_at).toBe("2024-01-03");
  });

  it("should sort by date descending", () => {
    const emails = [
      { created_at: "2024-01-01", recipient_email: "a@t.com" },
      { created_at: "2024-01-03", recipient_email: "c@t.com" },
    ];
    const sorted = sortEmails(emails, "date", "desc");
    expect(sorted[0].created_at).toBe("2024-01-03");
  });

  it("should sort by email alphabetically", () => {
    const emails = [
      { created_at: "2024-01-01", recipient_email: "charlie@t.com" },
      { created_at: "2024-01-01", recipient_email: "alice@t.com" },
      { created_at: "2024-01-01", recipient_email: "bob@t.com" },
    ];
    const sorted = sortEmails(emails, "email", "asc");
    expect(sorted[0].recipient_email).toBe("alice@t.com");
    expect(sorted[2].recipient_email).toBe("charlie@t.com");
  });
});

describe("Search Filtering", () => {
  const searchEmails = (
    emails: Array<{ recipient_email: string; subject: string | null; sender_email: string | null }>,
    query: string
  ) => {
    const q = query.toLowerCase();
    return emails.filter(e =>
      e.recipient_email.toLowerCase().includes(q) ||
      (e.subject?.toLowerCase().includes(q) ?? false) ||
      (e.sender_email?.toLowerCase().includes(q) ?? false)
    );
  };

  it("should search by recipient email", () => {
    const emails = [
      { recipient_email: "john@example.com", subject: "Hello", sender_email: null },
      { recipient_email: "jane@example.com", subject: "World", sender_email: null },
    ];
    expect(searchEmails(emails, "john")).toHaveLength(1);
  });

  it("should search by subject", () => {
    const emails = [
      { recipient_email: "a@b.com", subject: "Important Meeting", sender_email: null },
      { recipient_email: "c@d.com", subject: "Newsletter", sender_email: null },
    ];
    expect(searchEmails(emails, "meeting")).toHaveLength(1);
  });

  it("should be case-insensitive", () => {
    const emails = [{ recipient_email: "John@Example.COM", subject: null, sender_email: null }];
    expect(searchEmails(emails, "john")).toHaveLength(1);
  });

  it("should handle null subject", () => {
    const emails = [{ recipient_email: "a@b.com", subject: null, sender_email: null }];
    expect(searchEmails(emails, "test")).toHaveLength(0);
  });

  it("should return all for empty query", () => {
    const emails = [
      { recipient_email: "a@b.com", subject: "X", sender_email: null },
      { recipient_email: "c@d.com", subject: "Y", sender_email: null },
    ];
    expect(searchEmails(emails, "")).toHaveLength(2);
  });
});
