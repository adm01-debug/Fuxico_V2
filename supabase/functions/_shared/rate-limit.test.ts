// =============================================================================
// FUXICO - Testes para Rate Limiting
// Arquivo: supabase/functions/_shared/rate-limit.test.ts
// =============================================================================

import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { checkRateLimit, getClientIP, type RateLimitConfig } from "./rate-limit.ts";

Deno.test("Rate Limit - checkRateLimit com nova API", async (t) => {
  const uniqueId = `test-${Date.now()}-${Math.random()}`;
  
  await t.step("deve permitir primeira requisição", async () => {
    const config: RateLimitConfig = {
      keyPrefix: `test-new-${uniqueId}:`,
      maxRequests: 5,
      windowMs: 60000,
    };
    
    const result = await checkRateLimit("ip-1", config);
    assertEquals(result.allowed, true);
    assertEquals(result.remaining, 4);
    assertEquals(result.total, 1);
    assertEquals(result.limit, 5);
  });

  await t.step("deve bloquear após exceder limite", async () => {
    const config: RateLimitConfig = {
      keyPrefix: `test-block-${uniqueId}:`,
      maxRequests: 2,
      windowMs: 60000,
    };
    
    // Primeira requisição
    await checkRateLimit("ip-block", config);
    // Segunda requisição
    await checkRateLimit("ip-block", config);
    // Terceira requisição - deve bloquear
    const result = await checkRateLimit("ip-block", config);
    
    assertEquals(result.allowed, false);
    assertEquals(result.remaining, 0);
    assertEquals(result.total, 3);
  });
});

Deno.test("Rate Limit - checkRateLimit com API legada", async (t) => {
  const uniqueId = `legacy-${Date.now()}-${Math.random()}`;
  
  await t.step("deve funcionar com assinatura legada", async () => {
    const result = await checkRateLimit(`ip-legacy-${uniqueId}`, "test-endpoint", 10, 60);
    assertEquals(result.allowed, true);
    assertEquals(result.remaining, 9);
    assertEquals(result.limit, 10);
  });

  await t.step("deve usar valores padrão se não fornecidos", async () => {
    const result = await checkRateLimit(`ip-defaults-${uniqueId}`, "endpoint");
    assertEquals(result.allowed, true);
    assertEquals(result.limit, 60); // maxRequests padrão
  });
});

Deno.test("Rate Limit - getClientIP", async (t) => {
  await t.step("deve extrair IP de cf-connecting-ip", () => {
    const headers = new Headers({ "cf-connecting-ip": "1.2.3.4" });
    assertEquals(getClientIP(headers), "1.2.3.4");
  });

  await t.step("deve extrair IP de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "5.6.7.8, 9.10.11.12" });
    assertEquals(getClientIP(headers), "5.6.7.8");
  });

  await t.step("deve priorizar cf-connecting-ip sobre x-forwarded-for", () => {
    const headers = new Headers({
      "cf-connecting-ip": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
    });
    assertEquals(getClientIP(headers), "1.1.1.1");
  });

  await t.step("deve retornar 'unknown' se não houver IP", () => {
    const headers = new Headers();
    assertEquals(getClientIP(headers), "unknown");
  });

  await t.step("deve extrair de x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "10.0.0.1" });
    assertEquals(getClientIP(headers), "10.0.0.1");
  });
});

Deno.test("Rate Limit - diferentes identificadores", async (t) => {
  const uniqueId = `multi-${Date.now()}`;
  
  await t.step("deve rastrear IPs separadamente", async () => {
    const config: RateLimitConfig = {
      keyPrefix: `test-multi-${uniqueId}:`,
      maxRequests: 2,
      windowMs: 60000,
    };
    
    const result1 = await checkRateLimit("user-a", config);
    const result2 = await checkRateLimit("user-b", config);
    const result3 = await checkRateLimit("user-a", config);
    
    assertEquals(result1.total, 1);
    assertEquals(result2.total, 1);
    assertEquals(result3.total, 2);
  });
});
