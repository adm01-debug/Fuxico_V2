// =============================================================================
// FUXICO - Rate Limiting para Edge Functions
// Arquivo: supabase/functions/_shared/rate-limit.ts
// Descrição: Proteção contra abuso e DoS usando sliding window
// =============================================================================

/**
 * Configuração de rate limiting
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
  headers?: boolean;
}

/**
 * Resultado da verificação de rate limit
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
  limit: number;
}

// Cache em memória para rate limiting
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

/**
 * Verifica e atualiza o rate limit para um identificador
 * Suporta duas assinaturas:
 * - checkRateLimit(identifier, config) - nova API
 * - checkRateLimit(identifier, endpoint, maxRequests, windowSeconds) - API legada
 */
export async function checkRateLimit(
  identifier: string,
  configOrEndpoint: RateLimitConfig | string,
  maxRequests?: number,
  windowSeconds?: number
): Promise<RateLimitResult> {
  let config: RateLimitConfig;
  
  if (typeof configOrEndpoint === 'string') {
    // API legada: checkRateLimit(ip, 'endpoint', 60, 60)
    config = {
      keyPrefix: `rl:${configOrEndpoint}:`,
      maxRequests: maxRequests || 60,
      windowMs: (windowSeconds || 60) * 1000,
      message: 'Too many requests',
    };
  } else {
    config = configOrEndpoint;
  }
  
  const key = `${config.keyPrefix}${identifier}`;
  const now = Date.now();
  
  let entry = memoryStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }
  
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
 * Extrai IP do cliente de headers da requisição
 */
export function getClientIP(headers: Headers): string {
  const ipHeaders = [
    'cf-connecting-ip',
    'x-real-ip',
    'x-forwarded-for',
    'x-client-ip',
    'true-client-ip',
  ];
  
  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }
  
  return 'unknown';
}
