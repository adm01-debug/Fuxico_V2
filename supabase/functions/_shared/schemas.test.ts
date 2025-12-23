// =============================================================================
// FUXICO - Testes para Schemas de Validação
// Arquivo: supabase/functions/_shared/schemas.test.ts
// =============================================================================

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  emailSchema,
  uuidSchema,
  urlSchema,
  createTrackingSchema,
  trackEventSchema,
  reportBounceSchema,
  validate,
  validateRequest,
  sanitizeForLogging,
  escapeHtml,
  sanitizeString,
} from "./schemas.ts";

Deno.test("Schemas - emailSchema", async (t) => {
  await t.step("deve validar emails válidos", () => {
    const result = emailSchema.safeParse("test@example.com");
    assertEquals(result.success, true);
  });

  await t.step("deve rejeitar emails inválidos", () => {
    const result = emailSchema.safeParse("invalid-email");
    assertEquals(result.success, false);
  });

  await t.step("deve rejeitar string vazia", () => {
    const result = emailSchema.safeParse("");
    assertEquals(result.success, false);
  });
});

Deno.test("Schemas - uuidSchema", async (t) => {
  await t.step("deve validar UUIDs válidos", () => {
    const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    assertEquals(result.success, true);
  });

  await t.step("deve rejeitar UUIDs inválidos", () => {
    const result = uuidSchema.safeParse("not-a-uuid");
    assertEquals(result.success, false);
  });
});

Deno.test("Schemas - urlSchema", async (t) => {
  await t.step("deve validar URLs válidas", () => {
    assertEquals(urlSchema.safeParse("https://example.com").success, true);
    assertEquals(urlSchema.safeParse("http://localhost:3000").success, true);
    assertEquals(urlSchema.safeParse("https://example.com/path?query=1").success, true);
  });

  await t.step("deve rejeitar URLs inválidas", () => {
    assertEquals(urlSchema.safeParse("not-a-url").success, false);
    assertEquals(urlSchema.safeParse("example.com").success, false);
  });
});

Deno.test("Schemas - createTrackingSchema", async (t) => {
  await t.step("deve validar input correto", () => {
    const result = createTrackingSchema.safeParse({
      recipientEmail: "recipient@example.com",
      subject: "Test Subject",
      senderEmail: "sender@example.com",
    });
    assertEquals(result.success, true);
  });

  await t.step("deve usar subject padrão se não fornecido", () => {
    const result = createTrackingSchema.safeParse({
      recipientEmail: "recipient@example.com",
    });
    assertEquals(result.success, true);
    if (result.success) {
      assertEquals(result.data.subject, "(Sem assunto)");
    }
  });

  await t.step("deve rejeitar sem recipientEmail", () => {
    const result = createTrackingSchema.safeParse({
      subject: "Test",
    });
    assertEquals(result.success, false);
  });

  await t.step("deve aceitar metadata opcional", () => {
    const result = createTrackingSchema.safeParse({
      recipientEmail: "test@example.com",
      metadata: { campaign: "test", source: "api" },
    });
    assertEquals(result.success, true);
  });
});

Deno.test("Schemas - trackEventSchema", async (t) => {
  await t.step("deve validar evento com trackingId", () => {
    const result = trackEventSchema.safeParse({
      trackingId: "abc123",
    });
    assertEquals(result.success, true);
    if (result.success) {
      assertEquals(result.data.eventType, "open"); // default
    }
  });

  await t.step("deve aceitar eventType click", () => {
    const result = trackEventSchema.safeParse({
      trackingId: "abc123",
      eventType: "click",
    });
    assertEquals(result.success, true);
  });

  await t.step("deve rejeitar trackingId vazio", () => {
    const result = trackEventSchema.safeParse({
      trackingId: "",
    });
    assertEquals(result.success, false);
  });
});

Deno.test("Schemas - reportBounceSchema", async (t) => {
  await t.step("deve validar bounce report válido", () => {
    const result = reportBounceSchema.safeParse({
      trackingId: "abc123",
      bounceType: "hard",
      bounceReason: "Mailbox not found",
    });
    assertEquals(result.success, true);
  });

  await t.step("deve rejeitar bounceType inválido", () => {
    const result = reportBounceSchema.safeParse({
      trackingId: "abc123",
      bounceType: "invalid",
    });
    assertEquals(result.success, false);
  });

  await t.step("deve aceitar todos os tipos de bounce", () => {
    const types = ["hard", "soft", "complaint", "unknown"];
    for (const type of types) {
      const result = reportBounceSchema.safeParse({
        trackingId: "abc123",
        bounceType: type,
      });
      assertEquals(result.success, true, `Tipo ${type} deve ser válido`);
    }
  });
});

Deno.test("Schemas - validate utility", async (t) => {
  await t.step("deve retornar success: true para dados válidos", () => {
    const result = validate(emailSchema, "test@example.com");
    assertEquals(result.success, true);
    assertExists(result.data);
  });

  await t.step("deve retornar errors para dados inválidos", () => {
    const result = validate(emailSchema, "invalid");
    assertEquals(result.success, false);
    assertExists(result.errors);
    assert(result.errors!.length > 0);
  });
});

Deno.test("Schemas - validateRequest", async (t) => {
  await t.step("deve retornar dados para input válido", () => {
    const result = validateRequest(emailSchema, "test@example.com");
    assertEquals(typeof result, "string");
    assertEquals(result, "test@example.com");
  });

  await t.step("deve retornar Response 400 para input inválido", () => {
    const result = validateRequest(emailSchema, "invalid");
    assert(result instanceof Response);
    assertEquals((result as Response).status, 400);
  });
});

Deno.test("Schemas - sanitizeForLogging", () => {
  const data = {
    email: "test@example.com",
    password: "secret123",
    token: "abc123",
    name: "John",
  };

  const sanitized = sanitizeForLogging(data);
  
  assertEquals(sanitized.email, "test@example.com");
  assertEquals(sanitized.password, "[REDACTED]");
  assertEquals(sanitized.token, "[REDACTED]");
  assertEquals(sanitized.name, "John");
});

Deno.test("Schemas - escapeHtml", async (t) => {
  await t.step("deve escapar caracteres HTML", () => {
    assertEquals(escapeHtml("<script>"), "&lt;script&gt;");
    assertEquals(escapeHtml("a & b"), "a &amp; b");
    assertEquals(escapeHtml('"quoted"'), "&quot;quoted&quot;");
    assertEquals(escapeHtml("it's"), "it&#39;s");
  });

  await t.step("deve preservar texto normal", () => {
    assertEquals(escapeHtml("Hello World"), "Hello World");
    assertEquals(escapeHtml("123"), "123");
  });
});

Deno.test("Schemas - sanitizeString", async (t) => {
  await t.step("deve remover tags HTML", () => {
    assertEquals(sanitizeString("Hello <script>alert(1)</script>"), "Hello scriptalert(1)/script");
  });

  await t.step("deve remover javascript:", () => {
    assertEquals(sanitizeString("javascript:alert(1)"), "alert(1)");
  });

  await t.step("deve remover event handlers", () => {
    assertEquals(sanitizeString("onclick=alert(1)"), "alert(1)");
    assertEquals(sanitizeString("onmouseover=hack()"), "hack()");
  });

  await t.step("deve fazer trim", () => {
    assertEquals(sanitizeString("  hello  "), "hello");
  });
});
