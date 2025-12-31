// =============================================================================
// FUXICO - Security Headers (CSP, XSS, etc)
// Arquivo: supabase/functions/_shared/security-headers.ts
// Descrição: Headers de segurança para proteção contra XSS, Clickjacking, etc
// =============================================================================

/**
 * Headers de segurança para APIs
 */
export function getAPISecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'private, no-cache',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

/**
 * Headers específicos para endpoints de tracking (pixel, link)
 */
export function getTrackingSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'ALLOWALL',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Adiciona headers de segurança a uma Response existente
 */
export function addSecurityHeaders(
  response: Response,
  type: 'default' | 'tracking' | 'api' = 'default'
): Response {
  let securityHeaders: Record<string, string>;
  
  switch (type) {
    case 'tracking':
      securityHeaders = getTrackingSecurityHeaders();
      break;
    case 'api':
    default:
      securityHeaders = getAPISecurityHeaders();
  }
  
  const newHeaders = new Headers(response.headers);
  
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Cria Response JSON segura
 * Suporta duas assinaturas:
 * - secureJsonResponse(data, init?) - nova API
 * - secureJsonResponse(data, status, headers) - API legada
 */
export function secureJsonResponse(
  data: unknown,
  statusOrInit?: number | ResponseInit | Record<string, string>,
  legacyHeaders?: Record<string, string>
): Response {
  let status = 200;
  let additionalHeaders: Record<string, string> = {};
  
  if (typeof statusOrInit === 'number') {
    // API legada: secureJsonResponse(data, 200, corsHeaders)
    status = statusOrInit;
    additionalHeaders = legacyHeaders || {};
  } else if (statusOrInit && typeof statusOrInit === 'object') {
    // Check if it's ResponseInit or just headers
    if ('status' in statusOrInit || 'headers' in statusOrInit) {
      // Nova API: secureJsonResponse(data, { status: 200, headers: {...} })
      const init = statusOrInit as ResponseInit;
      status = init.status || 200;
      if (init.headers) {
        additionalHeaders = Object.fromEntries(
          new Headers(init.headers).entries()
        );
      }
    } else {
      // Just headers passed: secureJsonResponse(data, corsHeaders)
      additionalHeaders = statusOrInit as Record<string, string>;
    }
  }
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getAPISecurityHeaders(),
      ...additionalHeaders,
    },
  });
}

/**
 * Cria Response de erro segura
 */
export function secureErrorResponse(
  error: string | object,
  status: number,
  additionalHeaders?: Record<string, string>
): Response {
  const body = typeof error === 'string' ? { error } : error;
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getAPISecurityHeaders(),
      ...additionalHeaders,
    },
  });
}

/**
 * Cria Response com headers de segurança incluídos
 */
export function secureResponse(
  body: BodyInit | null,
  init: ResponseInit = {},
  type: 'default' | 'tracking' | 'api' = 'api'
): Response {
  let securityHeaders: Record<string, string>;
  
  switch (type) {
    case 'tracking':
      securityHeaders = getTrackingSecurityHeaders();
      break;
    case 'api':
    default:
      securityHeaders = getAPISecurityHeaders();
  }
  
  const headers = new Headers(init.headers);
  
  for (const [key, value] of Object.entries(securityHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  
  return new Response(body, {
    ...init,
    headers,
  });
}
