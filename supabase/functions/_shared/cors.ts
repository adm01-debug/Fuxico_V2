// =============================================================================
// FUXICO - CORS Restritivo Centralizado
// Arquivo: supabase/functions/_shared/cors.ts
// Descrição: Substitui CORS permissivo (*) por whitelist de domínios
// =============================================================================

/**
 * Lista de origens permitidas para requisições CORS.
 * 
 * IMPORTANTE: Adicione APENAS domínios confiáveis aqui.
 * Nunca use '*' em produção - isso permite CSRF e API abuse.
 */
export const ALLOWED_ORIGINS: string[] = [
  // Produção
  'https://fuxico.app',
  'https://www.fuxico.app',
  
  // Lovable hosting
  'https://fuxico.lovable.app',
  
  // Desenvolvimento local
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  
  // Chrome Extension (prefixo - validação especial)
  'chrome-extension://',
];

/**
 * Padrões de domínio permitidos (regex)
 * Usado para domínios dinâmicos como Supabase e Lovable previews
 */
const ALLOWED_DOMAIN_PATTERNS: RegExp[] = [
  // Supabase domains (*.supabase.co)
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
  
  // Lovable preview domains
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  
  // Lovable dev previews
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.lovable\.dev$/,
];

/**
 * Verifica se uma origem é permitida.
 * 
 * @param origin - Header Origin da requisição
 * @returns true se a origem é permitida, false caso contrário
 * 
 * @example
 * isOriginAllowed('https://fuxico.app') // true
 * isOriginAllowed('https://malicious.com') // false
 * isOriginAllowed('chrome-extension://abc123') // true
 */
export function isOriginAllowed(origin: string | null): boolean {
  // Sem origin = requisição não-browser (cURL, server-to-server)
  // Permitir apenas em contextos específicos
  if (!origin) {
    return false;
  }
  
  // Verificação exata na whitelist
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Verificação de prefixo para Chrome Extension
  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed.endsWith('://') && origin.startsWith(allowed)) {
      return true;
    }
  }
  
  // Verificação de padrões regex
  for (const pattern of ALLOWED_DOMAIN_PATTERNS) {
    if (pattern.test(origin)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gera headers CORS para uma requisição.
 * 
 * @param origin - Header Origin da requisição
 * @returns Objeto com headers CORS apropriados
 * 
 * @example
 * // Em uma Edge Function:
 * const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
 * return new Response(data, { headers: corsHeaders });
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Se a origem é permitida, espelhamos ela. Caso contrário, usamos o primeiro domínio.
  const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // Cache preflight por 24h
  };
}

/**
 * Cria uma resposta para requisições OPTIONS (preflight).
 * 
 * @param origin - Header Origin da requisição
 * @returns Response com status 204 e headers CORS
 * 
 * @example
 * if (req.method === 'OPTIONS') {
 *   return handleCorsPreflightRequest(req.headers.get('Origin'));
 * }
 */
export function handleCorsPreflightRequest(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Middleware CORS para Edge Functions.
 * Verifica a origem e retorna resposta de erro se não permitida.
 * 
 * @param origin - Header Origin da requisição
 * @returns Response de erro se origem não permitida, null se OK
 * 
 * @example
 * const corsError = validateCorsOrigin(req.headers.get('Origin'));
 * if (corsError) return corsError;
 */
export function validateCorsOrigin(origin: string | null): Response | null {
  // Permitir requisições sem origin (server-to-server, cURL)
  // NOTA: Ajustar conforme política de segurança do projeto
  if (!origin) {
    return null;
  }
  
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
 * 
 * @param body - Corpo da resposta
 * @param origin - Header Origin da requisição
 * @param init - Opções adicionais do Response
 * @returns Response com headers CORS
 * 
 * @example
 * return corsResponse(
 *   JSON.stringify({ success: true }),
 *   req.headers.get('Origin'),
 *   { status: 200 }
 * );
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

// =============================================================================
// TIPOS EXPORTADOS
// =============================================================================

export type CorsHeaders = ReturnType<typeof getCorsHeaders>;
