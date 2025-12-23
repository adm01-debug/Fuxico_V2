// =============================================================================
// FUXICO - Testes para Security Headers
// Arquivo: supabase/functions/_shared/security-headers.test.ts
// =============================================================================

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  getAPISecurityHeaders,
  getTrackingSecurityHeaders,
  addSecurityHeaders,
  secureJsonResponse,
  secureResponse,
} from "./security-headers.ts";

Deno.test("Security Headers - getAPISecurityHeaders", () => {
  const headers = getAPISecurityHeaders();
  
  assertEquals(headers["X-Content-Type-Options"], "nosniff");
  assertEquals(headers["X-Frame-Options"], "DENY");
  assertEquals(headers["Cache-Control"], "private, no-cache");
  assertEquals(headers["Content-Type"], "application/json; charset=utf-8");
});

Deno.test("Security Headers - getTrackingSecurityHeaders", () => {
  const headers = getTrackingSecurityHeaders();
  
  assertEquals(headers["X-Content-Type-Options"], "nosniff");
  assertEquals(headers["X-Frame-Options"], "ALLOWALL");
  assertEquals(headers["Cache-Control"], "no-cache, no-store, must-revalidate");
  assertEquals(headers["Pragma"], "no-cache");
  assertEquals(headers["Expires"], "0");
});

Deno.test("Security Headers - addSecurityHeaders", async (t) => {
  await t.step("deve adicionar headers de API por padrão", () => {
    const originalResponse = new Response("test");
    const securedResponse = addSecurityHeaders(originalResponse);
    
    assertEquals(securedResponse.headers.get("X-Content-Type-Options"), "nosniff");
    assertEquals(securedResponse.headers.get("X-Frame-Options"), "DENY");
  });

  await t.step("deve adicionar headers de tracking", () => {
    const originalResponse = new Response("test");
    const securedResponse = addSecurityHeaders(originalResponse, "tracking");
    
    assertEquals(securedResponse.headers.get("X-Frame-Options"), "ALLOWALL");
    assertEquals(securedResponse.headers.get("Pragma"), "no-cache");
  });

  await t.step("deve preservar status e body", async () => {
    const originalResponse = new Response("test body", { status: 201 });
    const securedResponse = addSecurityHeaders(originalResponse);
    
    assertEquals(securedResponse.status, 201);
    assertEquals(await securedResponse.text(), "test body");
  });
});

Deno.test("Security Headers - secureJsonResponse", async (t) => {
  await t.step("deve criar Response JSON com headers de segurança", async () => {
    const response = secureJsonResponse({ message: "ok" });
    
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("X-Content-Type-Options"), "nosniff");
    
    const body = await response.json();
    assertEquals(body.message, "ok");
  });

  await t.step("deve aceitar status customizado (API legada)", async () => {
    const response = secureJsonResponse({ error: "not found" }, 404);
    
    assertEquals(response.status, 404);
    
    const body = await response.json();
    assertEquals(body.error, "not found");
  });

  await t.step("deve aceitar status e headers (API legada)", async () => {
    const corsHeaders = { "Access-Control-Allow-Origin": "*" };
    const response = secureJsonResponse({ data: "test" }, 201, corsHeaders);
    
    assertEquals(response.status, 201);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(response.headers.get("X-Content-Type-Options"), "nosniff");
  });

  await t.step("deve aceitar ResponseInit (nova API)", async () => {
    const response = secureJsonResponse(
      { success: true },
      { status: 202, headers: { "X-Custom": "value" } }
    );
    
    assertEquals(response.status, 202);
    assertEquals(response.headers.get("X-Custom"), "value");
  });
});

Deno.test("Security Headers - secureResponse", async (t) => {
  await t.step("deve criar Response com headers de segurança", async () => {
    const response = secureResponse("plain text", { status: 200 });
    
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("X-Content-Type-Options"), "nosniff");
    assertEquals(await response.text(), "plain text");
  });

  await t.step("deve aceitar tipo tracking", () => {
    const response = secureResponse(null, { status: 204 }, "tracking");
    
    assertEquals(response.headers.get("X-Frame-Options"), "ALLOWALL");
    assertEquals(response.headers.get("Pragma"), "no-cache");
  });

  await t.step("não deve sobrescrever headers existentes", () => {
    const response = secureResponse(
      "test",
      { headers: { "X-Content-Type-Options": "custom" } }
    );
    
    assertEquals(response.headers.get("X-Content-Type-Options"), "custom");
  });
});
