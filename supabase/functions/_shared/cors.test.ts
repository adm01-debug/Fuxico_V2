// =============================================================================
// FUXICO - Testes para CORS
// Arquivo: supabase/functions/_shared/cors.test.ts
// =============================================================================

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  ALLOWED_ORIGINS,
  isOriginAllowed,
  getCorsHeaders,
  handleCorsPreflightRequest,
  validateCorsOrigin,
  corsResponse,
} from "./cors.ts";

Deno.test("CORS - isOriginAllowed", async (t) => {
  await t.step("deve permitir origens da lista", () => {
    assertEquals(isOriginAllowed("https://fuxico.app"), true);
    assertEquals(isOriginAllowed("http://localhost:5173"), true);
    assertEquals(isOriginAllowed("http://localhost:3000"), true);
  });

  await t.step("deve permitir extensões Chrome", () => {
    assertEquals(isOriginAllowed("chrome-extension://abc123"), true);
    assertEquals(isOriginAllowed("chrome-extension://xyz789def"), true);
  });

  await t.step("deve permitir subdomínios lovable.app", () => {
    assertEquals(isOriginAllowed("https://meuapp.lovable.app"), true);
    assertEquals(isOriginAllowed("https://test-project.lovable.app"), true);
  });

  await t.step("deve permitir subdomínios supabase.co", () => {
    assertEquals(isOriginAllowed("https://npjfwzzapbtcguoupozd.supabase.co"), true);
  });

  await t.step("deve rejeitar origens não permitidas", () => {
    assertEquals(isOriginAllowed("https://malicious-site.com"), false);
    assertEquals(isOriginAllowed("http://evil.com"), false);
    assertEquals(isOriginAllowed(null), false);
  });
});

Deno.test("CORS - getCorsHeaders", async (t) => {
  await t.step("deve retornar headers corretos para origem permitida", () => {
    const headers = getCorsHeaders("https://fuxico.app");
    assertEquals(headers["Access-Control-Allow-Origin"], "https://fuxico.app");
    assertEquals(headers["Access-Control-Allow-Credentials"], "true");
    assertExists(headers["Access-Control-Allow-Methods"]);
    assertExists(headers["Access-Control-Allow-Headers"]);
  });

  await t.step("deve usar origem padrão para origem não permitida", () => {
    const headers = getCorsHeaders("https://malicious.com");
    assertEquals(headers["Access-Control-Allow-Origin"], ALLOWED_ORIGINS[0]);
  });

  await t.step("deve usar origem padrão para null", () => {
    const headers = getCorsHeaders(null);
    assertEquals(headers["Access-Control-Allow-Origin"], ALLOWED_ORIGINS[0]);
  });
});

Deno.test("CORS - handleCorsPreflightRequest", async (t) => {
  await t.step("deve retornar Response 204 com origem string", () => {
    const response = handleCorsPreflightRequest("https://fuxico.app");
    assertEquals(response.status, 204);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "https://fuxico.app");
  });

  await t.step("deve retornar Response 204 com Request (API legada)", () => {
    const request = new Request("https://api.fuxico.app/test", {
      headers: { "Origin": "https://fuxico.app" },
    });
    const response = handleCorsPreflightRequest(request);
    assertEquals(response.status, 204);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "https://fuxico.app");
  });
});

Deno.test("CORS - validateCorsOrigin", async (t) => {
  await t.step("deve retornar null para origem permitida", () => {
    const result = validateCorsOrigin("https://fuxico.app");
    assertEquals(result, null);
  });

  await t.step("deve retornar null para origem null", () => {
    const result = validateCorsOrigin(null);
    assertEquals(result, null);
  });

  await t.step("deve retornar Response 403 para origem não permitida", async () => {
    const result = validateCorsOrigin("https://evil.com");
    assertExists(result);
    assertEquals(result!.status, 403);
    const body = await result!.json();
    assertEquals(body.error, "CORS_ORIGIN_NOT_ALLOWED");
  });
});

Deno.test("CORS - corsResponse", async (t) => {
  await t.step("deve criar Response com headers CORS", async () => {
    const response = corsResponse(
      JSON.stringify({ success: true }),
      "https://fuxico.app",
      { status: 200 }
    );
    
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "https://fuxico.app");
    assertEquals(response.headers.get("Content-Type"), "application/json");
    
    const body = await response.json();
    assertEquals(body.success, true);
  });
});
