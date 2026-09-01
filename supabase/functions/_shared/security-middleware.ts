// =============================================================================
// FUXICO - Security Middleware para Edge Functions
// Arquivo: supabase/functions/_shared/security-middleware.ts
// Descrição: Wrappers de segurança para padronizar handlers de funções
// =============================================================================

import { getCorsHeaders, handleCorsPreflightRequest } from './cors.ts';
import { validateIPAccess } from './ip-whitelist.ts';
import { addSecurityHeaders } from './security-headers.ts';

type Handler = (req: Request, corsHeaders: Record<string, string>) => Promise<Response>;

/**
 * Wrapper para funções protegidas que exigem validação de IP.
 */
export function protectedHandler(handler: Handler) {
  return async (req: Request) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
      return handleCorsPreflightRequest(req);
    }

    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    // 2. Validate IP Access
    const ipCheck = validateIPAccess(req);
    if (ipCheck) return ipCheck;

    // 3. Execute Handler
    try {
      const response = await handler(req, corsHeaders);
      
      // 4. Add Security Headers
      return addSecurityHeaders(response, 'api');
    } catch (error) {
      console.error('[Middleware Error]', error);
      return new Response(
        JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Wrapper para funções públicas (como tracking).
 */
export function publicHandler(handler: Handler) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return handleCorsPreflightRequest(req);
    }

    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    try {
      const response = await handler(req, corsHeaders);
      return addSecurityHeaders(response, 'tracking');
    } catch (error) {
      console.error('[Public Middleware Error]', error);
      return new Response(
        JSON.stringify({ error: 'INTERNAL_SERVER_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  };
}
