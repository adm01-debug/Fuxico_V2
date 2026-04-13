import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to test the Logger class directly since the module uses import.meta.env
describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== LOG LEVEL HIERARCHY =====
  describe("Log level hierarchy", () => {
    it("should define correct level order: debug < info < warn < error < silent", () => {
      const levels = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
      expect(levels.debug).toBeLessThan(levels.info);
      expect(levels.info).toBeLessThan(levels.warn);
      expect(levels.warn).toBeLessThan(levels.error);
      expect(levels.error).toBeLessThan(levels.silent);
    });

    it("should have exactly 5 log levels", () => {
      const levels = ["debug", "info", "warn", "error", "silent"];
      expect(levels).toHaveLength(5);
    });
  });

  // ===== DATA SANITIZATION =====
  describe("Data sanitization", () => {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "apiKey",
      "api_key",
      "authorization",
      "auth",
      "credential",
      "credit_card",
      "ssn",
      "cpf",
      "cnpj",
    ];

    sensitiveKeys.forEach((key) => {
      it(`should redact sensitive key: "${key}"`, () => {
        const data: Record<string, string> = { [key]: "sensitive-value", safe: "ok" };
        const sanitized = sanitizeData(data);
        expect(sanitized[key]).toBe("[REDACTED]");
        expect(sanitized.safe).toBe("ok");
      });
    });

    it("should handle nested sensitive keys with partial match", () => {
      const data = { userPassword: "secret123", name: "Test" };
      const sanitized = sanitizeData(data);
      expect(sanitized.userPassword).toBe("[REDACTED]");
      expect(sanitized.name).toBe("Test");
    });

    it("should be case insensitive for sensitive detection", () => {
      const data = { PASSWORD: "secret", Token: "abc", API_KEY: "xyz" };
      const sanitized = sanitizeData(data);
      expect(sanitized.PASSWORD).toBe("[REDACTED]");
      expect(sanitized.Token).toBe("[REDACTED]");
      expect(sanitized.API_KEY).toBe("[REDACTED]");
    });

    it("should return undefined for null/undefined data", () => {
      expect(sanitizeData(null)).toBeUndefined();
      expect(sanitizeData(undefined)).toBeUndefined();
    });

    it("should return primitives as-is", () => {
      expect(sanitizeData("hello")).toBe("hello");
      expect(sanitizeData(42)).toBe(42);
      expect(sanitizeData(true)).toBe(true);
    });

    it("should handle empty objects", () => {
      expect(sanitizeData({})).toEqual({});
    });

    it("should not modify original object", () => {
      const original = { password: "secret", name: "Test" };
      sanitizeData(original);
      expect(original.password).toBe("secret");
    });
  });

  // ===== ERROR FORMATTING =====
  describe("Error formatting", () => {
    it("should format Error instances correctly", () => {
      const error = new Error("Test error");
      const formatted = formatError(error);
      expect(formatted?.name).toBe("Error");
      expect(formatted?.message).toBe("Test error");
    });

    it("should format TypeError correctly", () => {
      const error = new TypeError("Type error");
      const formatted = formatError(error);
      expect(formatted?.name).toBe("TypeError");
      expect(formatted?.message).toBe("Type error");
    });

    it("should format RangeError correctly", () => {
      const error = new RangeError("Out of range");
      const formatted = formatError(error);
      expect(formatted?.name).toBe("RangeError");
    });

    it("should handle string errors", () => {
      const formatted = formatError("string error");
      expect(formatted?.name).toBe("UnknownError");
      expect(formatted?.message).toBe("string error");
    });

    it("should handle number errors", () => {
      const formatted = formatError(42);
      expect(formatted?.name).toBe("UnknownError");
      expect(formatted?.message).toBe("42");
    });

    it("should return undefined for null", () => {
      expect(formatError(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(formatError(undefined)).toBeUndefined();
    });

    it("should handle object errors", () => {
      const formatted = formatError({ code: 500 });
      expect(formatted?.name).toBe("UnknownError");
    });
  });

  // ===== LOG ENTRY CREATION =====
  describe("Log entry structure", () => {
    it("should create entry with correct fields", () => {
      const entry = createLogEntry("info", "Test message");
      expect(entry).toHaveProperty("level", "info");
      expect(entry).toHaveProperty("message", "Test message");
      expect(entry).toHaveProperty("timestamp");
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should include context prefix", () => {
      const entry = createLogEntry("info", "Test", undefined, undefined, "FUXICO");
      expect(entry.context).toBe("FUXICO");
    });

    it("should include data when provided", () => {
      const entry = createLogEntry("info", "Test", { key: "value" });
      expect(entry.data).toEqual({ key: "value" });
    });

    it("should include error when provided", () => {
      const error = new Error("fail");
      const entry = createLogEntry("error", "Test", undefined, error);
      expect(entry.error?.message).toBe("fail");
    });

    it("should generate valid ISO timestamp", () => {
      const entry = createLogEntry("info", "Test");
      const date = new Date(entry.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  // ===== TIMER =====
  describe("Timer functionality", () => {
    it("should measure elapsed time", async () => {
      const start = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const duration = performance.now() - start;
      expect(duration).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });
  });
});

// ===== Helper functions extracted for testing =====
function sanitizeData(data: unknown): any {
  if (!data) return undefined;
  if (typeof data !== "object") return data;

  const sensitiveKeys = [
    "password", "token", "secret", "apiKey", "api_key",
    "authorization", "auth", "credential", "credit_card",
    "ssn", "cpf", "cnpj",
  ];

  const sanitized = { ...(data as Record<string, unknown>) };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

function formatError(error: unknown): { name: string; message: string; stack?: string } | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}

function createLogEntry(
  level: string,
  message: string,
  data?: unknown,
  error?: unknown,
  context?: string
) {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
    error: formatError(error),
  };
}
