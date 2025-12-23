// =============================================================================
// FUXICO - CORS Centralizado
// Arquivo: supabase/functions/_shared/cors.ts
// Descrição: Headers CORS para Edge Functions
// =============================================================================

/**
 * Lista de origens permitidas para requisições CORS.
 */
export const ALLOWED_ORIGINS: string[] = [
  'https://fuxico.app',
  'https://www.fuxico.app',
  'https://fuxico.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'chrome-extension://',
];

/**
 * Padrões de domínio permitidos (regex)
 */
const ALLOWED_DOMAIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.lovable\.dev$/,
];

/**
 * Verifica se uma origem é permitida.
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed.endsWith('://') && origin.startsWith(allowed)) {
      return true;
    }
  }
  
  for (const pattern of ALLOWED_DOMAIN_PATTERNS) {
    if (pattern.test(origin)) return true;
  }
  
  return false;
}

/**
 * Gera headers CORS para uma requisição.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Cria uma resposta para requisições OPTIONS (preflight).
 * Suporta duas assinaturas:
 * - handleCorsPreflightRequest(origin: string) - nova API
 * - handleCorsPreflightRequest(req: Request) - API legada
 */
export function handleCorsPreflightRequest(originOrRequest: string | null | Request): Response {
  let origin: string | null;
  
  if (originOrRequest instanceof Request) {
    // API legada: handleCorsPreflightRequest(req)
    origin = originOrRequest.headers.get('origin');
  } else {
    // Nova API: handleCorsPreflightRequest(origin)
    origin = originOrRequest;
  }
  
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Middleware CORS para Edge Functions.
 */
export function validateCorsOrigin(origin: string | null): Response | null {
  if (!origin) return null;
  
  if (!isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ 
        error: 'CORS_ORIGIN_NOT_ALLOWED',
        message: 'Origin not in allowed list',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin),
        },
      }
    );
  }
  
  return null;
}

/**
 * Helper para criar Response com headers CORS.
 */
export function corsResponse(
  body: BodyInit | null,
  origin: string | null,
  init?: ResponseInit
): Response {
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(body, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

export type CorsHeaders = ReturnType<typeof getCorsHeaders>;
