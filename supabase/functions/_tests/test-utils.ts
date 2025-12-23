// =============================================================================
// FUXICO - Utilitários para Testes de Edge Functions
// Arquivo: supabase/functions/_tests/test-utils.ts
// =============================================================================

/**
 * Cria uma Request mockada para testes
 */
export function createMockRequest(
  url: string,
  options: RequestInit & { 
    origin?: string;
    ip?: string;
    authorization?: string;
  } = {}
): Request {
  const headers = new Headers(options.headers);
  
  if (options.origin) {
    headers.set("Origin", options.origin);
  }
  
  if (options.ip) {
    headers.set("X-Forwarded-For", options.ip);
  }
  
  if (options.authorization) {
    headers.set("Authorization", options.authorization);
  }
  
  return new Request(url, {
    ...options,
    headers,
  });
}

/**
 * Cria Request OPTIONS para teste de preflight CORS
 */
export function createPreflightRequest(url: string, origin: string): Request {
  return createMockRequest(url, {
    method: "OPTIONS",
    origin,
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type, authorization",
    },
  });
}

/**
 * Cria Request POST com JSON body
 */
export function createJsonRequest(
  url: string,
  body: unknown,
  options: { origin?: string; ip?: string; authorization?: string } = {}
): Request {
  return createMockRequest(url, {
    method: "POST",
    origin: options.origin || "http://localhost:5173",
    ip: options.ip || "127.0.0.1",
    authorization: options.authorization,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Mock de Deno.env para testes
 */
export function mockEnv(env: Record<string, string>): () => void {
  const originalGet = Deno.env.get;
  
  Deno.env.get = (key: string) => env[key] ?? originalGet.call(Deno.env, key);
  
  return () => {
    Deno.env.get = originalGet;
  };
}

/**
 * Verifica se Response tem headers CORS corretos
 */
export function assertCorsHeaders(response: Response, origin?: string): void {
  const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
  
  if (!allowOrigin) {
    throw new Error("Missing Access-Control-Allow-Origin header");
  }
  
  if (origin && allowOrigin !== origin && allowOrigin !== "*") {
    throw new Error(`Expected CORS origin ${origin}, got ${allowOrigin}`);
  }
}

/**
 * Verifica se Response tem headers de segurança
 */
export function assertSecurityHeaders(response: Response): void {
  const contentTypeOptions = response.headers.get("X-Content-Type-Options");
  
  if (contentTypeOptions !== "nosniff") {
    throw new Error(`Expected X-Content-Type-Options: nosniff, got ${contentTypeOptions}`);
  }
}

/**
 * Extrai body JSON de Response
 */
export async function getJsonBody<T = unknown>(response: Response): Promise<T> {
  return await response.json() as T;
}

/**
 * Gera UUID aleatório para testes
 */
export function generateTestUUID(): string {
  return crypto.randomUUID();
}

/**
 * Gera tracking ID aleatório para testes
 */
export function generateTestTrackingId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Delay para testes assíncronos
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock de console para capturar logs
 */
export function mockConsole(): { 
  logs: string[]; 
  errors: string[]; 
  restore: () => void 
} {
  const logs: string[] = [];
  const errors: string[] = [];
  
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    logs.push(args.map(String).join(" "));
  };
  
  console.error = (...args) => {
    errors.push(args.map(String).join(" "));
  };
  
  return {
    logs,
    errors,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    },
  };
}
