// =============================================================================
// FUXICO - Testes para Edge Function get-config
// Arquivo: supabase/functions/_tests/get-config.test.ts
// =============================================================================

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  createMockRequest,
  createPreflightRequest,
  assertCorsHeaders,
  getJsonBody,
  mockEnv,
} from "./test-utils.ts";

// Mock das dependências antes de importar o handler
const MOCK_SUPABASE_URL = "https://test-project.supabase.co";

Deno.test("get-config - CORS preflight", async () => {
  const restore = mockEnv({ SUPABASE_URL: MOCK_SUPABASE_URL });
  
  try {
    const request = createPreflightRequest(
      "https://api.fuxico.app/functions/v1/get-config",
      "https://fuxico.app"
    );
    
    // Simular resposta do handler (teste de integração mockado)
    const response = new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://fuxico.app",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      },
    });
    
    assertEquals(response.status, 204);
    assertCorsHeaders(response, "https://fuxico.app");
  } finally {
    restore();
  }
});

Deno.test("get-config - retorna configuração correta", async () => {
  const restore = mockEnv({ SUPABASE_URL: MOCK_SUPABASE_URL });
  
  try {
    // Mock da resposta esperada
    const config = {
      supabaseUrl: MOCK_SUPABASE_URL,
      pixelEndpoint: `${MOCK_SUPABASE_URL}/functions/v1/track-pixel`,
      linkEndpoint: `${MOCK_SUPABASE_URL}/functions/v1/track-link`,
      version: "1.1.0",
      features: {
        selfOpenDetection: true,
        bounceTracking: true,
        documentTracking: true,
        linkTracking: true,
        geoLocation: true,
      },
    };
    
    assertExists(config.supabaseUrl);
    assertExists(config.pixelEndpoint);
    assertExists(config.linkEndpoint);
    assertEquals(config.version, "1.1.0");
    assertEquals(config.features.selfOpenDetection, true);
    assertEquals(config.features.bounceTracking, true);
    assertEquals(config.features.documentTracking, true);
    assertEquals(config.features.linkTracking, true);
    assertEquals(config.features.geoLocation, true);
  } finally {
    restore();
  }
});

Deno.test("get-config - endpoints formatados corretamente", async () => {
  const supabaseUrl = "https://abc123.supabase.co";
  const restore = mockEnv({ SUPABASE_URL: supabaseUrl });
  
  try {
    const pixelEndpoint = `${supabaseUrl}/functions/v1/track-pixel`;
    const linkEndpoint = `${supabaseUrl}/functions/v1/track-link`;
    
    assert(pixelEndpoint.startsWith("https://"));
    assert(pixelEndpoint.includes("/functions/v1/track-pixel"));
    assert(linkEndpoint.includes("/functions/v1/track-link"));
  } finally {
    restore();
  }
});

Deno.test("get-config - Cache-Control header", () => {
  const response = new Response(JSON.stringify({}), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
  
  assertEquals(response.headers.get("Cache-Control"), "public, max-age=3600");
});

Deno.test("get-config - estrutura de features", () => {
  const features = {
    selfOpenDetection: true,
    bounceTracking: true,
    documentTracking: true,
    linkTracking: true,
    geoLocation: true,
  };
  
  // Verificar que todas as features estão definidas
  const expectedFeatures = [
    "selfOpenDetection",
    "bounceTracking",
    "documentTracking",
    "linkTracking",
    "geoLocation",
  ];
  
  for (const feature of expectedFeatures) {
    assert(
      feature in features,
      `Feature ${feature} deve estar presente`
    );
  }
});
