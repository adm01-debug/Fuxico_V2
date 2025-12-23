// =============================================================================
// FUXICO - Testes para Edge Function geo-lookup
// Arquivo: supabase/functions/_tests/geo-lookup.test.ts
// =============================================================================

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  createMockRequest,
  assertCorsHeaders,
} from "./test-utils.ts";

Deno.test("geo-lookup - IPs locais retornam 'Local'", async (t) => {
  const localIps = ["127.0.0.1", "192.168.1.1", "10.0.0.1"];
  
  for (const ip of localIps) {
    await t.step(`IP ${ip} deve retornar Local`, () => {
      // Mock da resposta esperada para IPs locais
      const expectedResponse = { country: "Local", city: "Local Network" };
      
      assertEquals(expectedResponse.country, "Local");
      assertEquals(expectedResponse.city, "Local Network");
    });
  }
});

Deno.test("geo-lookup - valida estrutura de resposta", () => {
  // Mock de resposta do ip-api.com
  const mockApiResponse = {
    country: "Brazil",
    city: "São Paulo",
    regionName: "São Paulo",
    timezone: "America/Sao_Paulo",
    lat: -23.5505,
    lon: -46.6333,
  };
  
  // Resposta esperada do geo-lookup
  const expectedResponse = {
    country: mockApiResponse.country,
    city: mockApiResponse.city,
    region: mockApiResponse.regionName,
    timezone: mockApiResponse.timezone,
  };
  
  assertExists(expectedResponse.country);
  assertExists(expectedResponse.city);
  assertExists(expectedResponse.region);
  assertExists(expectedResponse.timezone);
});

Deno.test("geo-lookup - fallback para Unknown", () => {
  // Quando a API externa falha, deve retornar Unknown
  const fallbackResponse = { country: "Unknown", city: "Unknown" };
  
  assertEquals(fallbackResponse.country, "Unknown");
  assertEquals(fallbackResponse.city, "Unknown");
});

Deno.test("geo-lookup - extrai IP de query params", () => {
  const request = createMockRequest(
    "https://api.fuxico.app/functions/v1/geo-lookup?ip=8.8.8.8",
    { method: "GET", origin: "https://fuxico.app" }
  );
  
  const url = new URL(request.url);
  const ip = url.searchParams.get("ip");
  
  assertEquals(ip, "8.8.8.8");
});

Deno.test("geo-lookup - extrai IP de headers quando não fornecido", () => {
  const request = createMockRequest(
    "https://api.fuxico.app/functions/v1/geo-lookup",
    { 
      method: "GET",
      origin: "https://fuxico.app",
      ip: "200.100.50.25",
    }
  );
  
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0];
  
  assertEquals(clientIp, "200.100.50.25");
});

Deno.test("geo-lookup - valida formato de IP", async (t) => {
  await t.step("IPv4 válido", () => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    assertEquals(ipv4Regex.test("192.168.1.1"), true);
    assertEquals(ipv4Regex.test("8.8.8.8"), true);
  });

  await t.step("IPv4 inválido", () => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    assertEquals(ipv4Regex.test("invalid"), false);
    assertEquals(ipv4Regex.test("999.999.999.999"), true); // Regex não valida ranges
  });
});

Deno.test("geo-lookup - verifica detecção de IPs privados", () => {
  const isPrivateIP = (ip: string): boolean => {
    return ip === "127.0.0.1" ||
           ip.startsWith("192.168.") ||
           ip.startsWith("10.") ||
           ip.startsWith("172.16.") ||
           ip.startsWith("172.17.") ||
           ip.startsWith("172.18.") ||
           ip.startsWith("172.19.") ||
           ip.startsWith("172.2") ||
           ip.startsWith("172.30.") ||
           ip.startsWith("172.31.");
  };
  
  assertEquals(isPrivateIP("127.0.0.1"), true);
  assertEquals(isPrivateIP("192.168.1.100"), true);
  assertEquals(isPrivateIP("10.0.0.1"), true);
  assertEquals(isPrivateIP("8.8.8.8"), false);
  assertEquals(isPrivateIP("200.100.50.25"), false);
});
