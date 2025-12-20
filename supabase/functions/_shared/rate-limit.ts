// =============================================================================
// FUXICO - Rate Limiting para Edge Functions
// Arquivo: supabase/functions/_shared/rate-limit.ts
// Descrição: Proteção contra abuso e DoS usando sliding window
// =============================================================================

/**
 * Configuração de rate limiting
 */
export interface RateLimitConfig {
  /** Janela de tempo em milissegundos (ex: 60000 = 1 minuto) */
  windowMs: number;
  /** Máximo de requisições permitidas por janela */
  maxRequests: number;
  /** Prefixo para chaves de cache */
  keyPrefix: string;
  /** Mensagem de erro customizada */
  message?: string;
  /** Se deve incluir headers de rate limit na resposta */
  headers?: boolean;
}

/**
 * Resultado da verificação de rate limit
 */
export interface RateLimitResult {
  /** Se a requisição é permitida */
  allowed: boolean;
  /** Requisições restantes na janela atual */
  remaining: number;
  /** Timestamp de reset da janela (Unix ms) */
  resetAt: number;
  /** Total de requisições na janela */
  total: number;
  /** Limite configurado */
  limit: number;
}

/**
 * Headers de rate limit para resposta HTTP
 */
export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

// =============================================================================
// CONFIGURAÇÕES PADRÃO POR ENDPOINT
// =============================================================================

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Endpoints públicos (mais restritivos)
  'track-pixel': {
    windowMs: 60000, // 1 minuto
    maxRequests: 100, // 100 req/min por IP
    keyPrefix: 'rl:pixel:',
    message: 'Too many tracking requests',
  },
  'track-link': {
    windowMs: 60000,
    maxRequests: 100,
    keyPrefix: 'rl:link:',
    message: 'Too many link tracking requests',
  },
  'track-document': {
    windowMs: 60000,
    maxRequests: 50,
    keyPrefix: 'rl:doc:',
    message: 'Too many document tracking requests',
  },
  
  // Endpoints autenticados (mais permissivos)
  'get-tracking-stats': {
    windowMs: 60000,
    maxRequests: 30,
    keyPrefix: 'rl:stats:',
    message: 'Too many stats requests',
  },
  'create-tracking': {
    windowMs: 60000,
    maxRequests: 60,
    keyPrefix: 'rl:create:',
    message: 'Too many tracking creation requests',
  },
  'bitrix24-sync': {
    windowMs: 60000,
    maxRequests: 30,
    keyPrefix: 'rl:bitrix:',
    message: 'Too many Bitrix24 sync requests',
  },
  
  // Endpoints gerais
  default: {
    windowMs: 60000,
    maxRequests: 60,
    keyPrefix: 'rl:default:',
    message: 'Too many requests',
    headers: true,
  },
};

// =============================================================================
// ARMAZENAMENTO EM MEMÓRIA (para Edge Functions)
// =============================================================================

/**
 * Cache em memória para rate limiting
 * NOTA: Em produção com múltiplas instâncias, usar Redis/Upstash
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Limpa entradas expiradas do cache
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

// Limpar a cada 5 minutos
setInterval(cleanupExpired, 5 * 60 * 1000);

// =============================================================================
// FUNÇÕES PRINCIPAIS
// =============================================================================

/**
 * Verifica e atualiza o rate limit para um identificador
 * 
 * @param identifier - IP, user_id ou outro identificador único
 * @param config - Configuração de rate limit
 * @returns Resultado da verificação
 * 
 * @example
 * const result = await checkRateLimit(clientIP, RATE_LIMIT_CONFIGS['track-pixel']);
 * if (!result.allowed) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}${identifier}`;
  const now = Date.now();
  
  // Buscar ou criar entrada
  let entry = memoryStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Nova janela
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }
  
  // Incrementar contador
  entry.count++;
  memoryStore.set(key, entry);
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    total: entry.count,
    limit: config.maxRequests,
  };
}

/**
 * Gera headers de rate limit para resposta HTTP
 */
export function getRateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    headers['Retry-After'] = Math.max(1, retryAfter).toString();
  }
  
  return headers;
}

/**
 * Cria resposta de rate limit exceeded
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  config: RateLimitConfig
): Response {
  const headers = getRateLimitHeaders(result);
  
  return new Response(
    JSON.stringify({
      error: 'RATE_LIMIT_EXCEEDED',
      message: config.message || 'Too many requests',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * Extrai IP do cliente de headers da requisição
 */
export function getClientIP(headers: Headers): string {
  // Ordem de prioridade para diferentes proxies
  const ipHeaders = [
    'cf-connecting-ip',     // Cloudflare
    'x-real-ip',            // Nginx
    'x-forwarded-for',      // Proxies padrão
    'x-client-ip',          // Apache
    'true-client-ip',       // Akamai
  ];
  
  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for pode ter múltiplos IPs
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }
  
  return 'unknown';
}

/**
 * Middleware de rate limiting para Edge Functions
 * 
 * @example
 * // No início da Edge Function:
 * const rateLimitResponse = await rateLimitMiddleware(req, 'track-pixel');
 * if (rateLimitResponse) return rateLimitResponse;
 */
export async function rateLimitMiddleware(
  req: Request,
  endpoint: string
): Promise<Response | null> {
  const config = RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS.default;
  const clientIP = getClientIP(req.headers);
  
  // Também considerar user_id se autenticado
  const authHeader = req.headers.get('Authorization');
  const identifier = authHeader 
    ? `${clientIP}:${authHeader.slice(-8)}` // IP + últimos 8 chars do token
    : clientIP;
  
  const result = await checkRateLimit(identifier, config);
  
  if (!result.allowed) {
    return rateLimitExceededResponse(result, config);
  }
  
  return null;
}

/**
 * Adiciona headers de rate limit a uma Response existente
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = getRateLimitHeaders(result);
  const newHeaders = new Headers(response.headers);
  
  Object.entries(headers).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// =============================================================================
// RATE LIMITING COM SUPABASE (alternativa persistente)
// =============================================================================

/**
 * Rate limiting usando Supabase como backend
 * Útil quando há múltiplas instâncias de Edge Functions
 * 
 * @example
 * const limiter = new SupabaseRateLimiter(supabaseClient);
 * const result = await limiter.check(clientIP, config);
 */
export class SupabaseRateLimiter {
  private supabase: unknown; // SupabaseClient type

  constructor(supabaseClient: unknown) {
    this.supabase = supabaseClient;
  }

  async check(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    // Implementação usando RPC do Supabase
    // Requer tabela rate_limits e função check_rate_limit
    
    const client = this.supabase as {
      rpc: (name: string, params: Record<string, unknown>) => Promise<{
        data: RateLimitResult | null;
        error: { message: string } | null;
      }>;
    };
    
    const { data, error } = await client.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_key_prefix: config.keyPrefix,
      p_window_ms: config.windowMs,
      p_max_requests: config.maxRequests,
    });

    if (error || !data) {
      // Em caso de erro, permitir (fail-open)
      console.error('Rate limit check failed:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: Date.now() + config.windowMs,
        total: 0,
        limit: config.maxRequests,
      };
    }

    return data;
  }
}

// =============================================================================
// SQL PARA TABELA DE RATE LIMITING (opcional)
// =============================================================================

/**
 * SQL para criar tabela e função de rate limiting no Supabase
 * Execute isso no SQL Editor do Supabase se quiser persistência
 */
export const RATE_LIMIT_SQL = `
-- Tabela para armazenar contadores de rate limit
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índice para limpeza
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits(reset_at);

-- Função para verificar e incrementar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_key_prefix text,
  p_window_ms integer,
  p_max_requests integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_key text;
  v_now timestamptz;
  v_reset_at timestamptz;
  v_count integer;
  v_allowed boolean;
BEGIN
  v_key := p_key_prefix || p_identifier;
  v_now := now();
  v_reset_at := v_now + (p_window_ms || ' milliseconds')::interval;
  
  -- Inserir ou atualizar atomicamente
  INSERT INTO public.rate_limits (key, count, reset_at)
  VALUES (v_key, 1, v_reset_at)
  ON CONFLICT (key) DO UPDATE
  SET 
    count = CASE 
      WHEN rate_limits.reset_at < v_now THEN 1  -- Nova janela
      ELSE rate_limits.count + 1                 -- Mesma janela
    END,
    reset_at = CASE 
      WHEN rate_limits.reset_at < v_now THEN v_reset_at
      ELSE rate_limits.reset_at
    END
  RETURNING count, reset_at INTO v_count, v_reset_at;
  
  v_allowed := v_count <= p_max_requests;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', GREATEST(0, p_max_requests - v_count),
    'resetAt', extract(epoch from v_reset_at) * 1000,
    'total', v_count,
    'limit', p_max_requests
  );
END;
$$;

-- Job para limpar entradas antigas (executar via pg_cron)
-- SELECT cron.schedule('cleanup-rate-limits', '*/15 * * * *', 
--   $$DELETE FROM public.rate_limits WHERE reset_at < now() - interval '1 hour'$$);
`;
