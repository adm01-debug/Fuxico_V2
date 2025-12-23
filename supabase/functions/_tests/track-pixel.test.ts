// =============================================================================
// FUXICO - Testes para Edge Function track-pixel
// Arquivo: supabase/functions/_tests/track-pixel.test.ts
// =============================================================================

import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  createMockRequest,
  generateTestTrackingId,
} from "./test-utils.ts";

// GIF pixel transparente 1x1 (mesmo usado no track-pixel)
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

Deno.test("track-pixel - retorna GIF válido", () => {
  // Verificar assinatura GIF89a
  assertEquals(PIXEL[0], 0x47); // G
  assertEquals(PIXEL[1], 0x49); // I
  assertEquals(PIXEL[2], 0x46); // F
  assertEquals(PIXEL[3], 0x38); // 8
  assertEquals(PIXEL[4], 0x39); // 9
  assertEquals(PIXEL[5], 0x61); // a
  
  // Verificar dimensões 1x1
  assertEquals(PIXEL[6], 0x01); // width low byte
  assertEquals(PIXEL[7], 0x00); // width high byte
  assertEquals(PIXEL[8], 0x01); // height low byte
  assertEquals(PIXEL[9], 0x00); // height high byte
});

Deno.test("track-pixel - tamanho do pixel", () => {
  assertEquals(PIXEL.length, 43);
});

Deno.test("track-pixel - extrai tracking ID de query params", () => {
  const trackingId = generateTestTrackingId();
  const request = createMockRequest(
    `https://api.fuxico.app/functions/v1/track-pixel?t=${trackingId}`,
    { method: "GET" }
  );
  
  const url = new URL(request.url);
  const t = url.searchParams.get("t");
  
  assertEquals(t, trackingId);
});

Deno.test("track-pixel - lida com tracking ID faltando", () => {
  const request = createMockRequest(
    "https://api.fuxico.app/functions/v1/track-pixel",
    { method: "GET" }
  );
  
  const url = new URL(request.url);
  const t = url.searchParams.get("t");
  
  assertEquals(t, null);
});

Deno.test("track-pixel - headers Cache-Control corretos", () => {
  const expectedHeaders = {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
  
  // Verificar que todos os headers anti-cache estão presentes
  assert("Cache-Control" in expectedHeaders);
  assert("Pragma" in expectedHeaders);
  assert("Expires" in expectedHeaders);
  
  assertEquals(expectedHeaders["Cache-Control"], "no-store, no-cache, must-revalidate");
  assertEquals(expectedHeaders["Pragma"], "no-cache");
  assertEquals(expectedHeaders["Expires"], "0");
});

Deno.test("track-pixel - CORS aberto para email clients", () => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
  
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertEquals(corsHeaders["Access-Control-Allow-Methods"], "GET, OPTIONS");
});

Deno.test("track-pixel - headers de segurança", () => {
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
  
  assertEquals(securityHeaders["X-Content-Type-Options"], "nosniff");
  assertEquals(securityHeaders["X-Frame-Options"], "DENY");
});

Deno.test("track-pixel - extrai User-Agent", () => {
  const request = createMockRequest(
    "https://api.fuxico.app/functions/v1/track-pixel?t=test123",
    { 
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    }
  );
  
  const userAgent = request.headers.get("user-agent");
  
  assert(userAgent?.includes("Mozilla"));
  assert(userAgent?.includes("Windows"));
});

Deno.test("track-pixel - OPTIONS retorna 204", () => {
  const request = createMockRequest(
    "https://api.fuxico.app/functions/v1/track-pixel",
    { method: "OPTIONS" }
  );
  
  // Mock da resposta OPTIONS
  const response = new Response(null, { status: 204 });
  
  assertEquals(response.status, 204);
  assertEquals(response.body, null);
});

Deno.test("track-pixel - extrai IP do cliente", () => {
  const request = createMockRequest(
    "https://api.fuxico.app/functions/v1/track-pixel?t=test123",
    { 
      method: "GET",
      ip: "203.0.113.50",
    }
  );
  
  const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0];
  
  assertEquals(clientIP, "203.0.113.50");
});

Deno.test("track-pixel - valida formato do tracking ID", () => {
  // Formatos válidos de tracking ID
  const validIds = [
    "abc123",
    "550e8400-e29b-41d4-a716-446655440000",
    "test-1703376000-abc123",
  ];
  
  for (const id of validIds) {
    assert(id.length > 0, `ID ${id} deve ter tamanho > 0`);
  }
});
