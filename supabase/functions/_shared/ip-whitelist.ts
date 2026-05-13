// =============================================================================
// FUXICO - IP Whitelist para Edge Functions
// Arquivo: supabase/functions/_shared/ip-whitelist.ts
// Descrição: Gerenciamento de IPs permitidos para funções administrativas
// =============================================================================

import { getClientIP } from './rate-limit.ts';

/**
 * Lista de IPs permitidos (Whitelisted)
 * Em produção, deve ser carregado de variáveis de ambiente ou banco de dados.
 */
const DEFAULT_WHITELIST = [
  '127.0.0.1',
  '::1',
  // Adicione IPs fixos de infraestrutura aqui
];

/**
 * Verifica se o IP da requisição está na lista permitida.
 */
export function isIPAllowed(req: Request): boolean {
  const clientIP = getClientIP(req.headers);
  const envWhitelist = (typeof (globalThis as any).Deno !== 'undefined' ? (globalThis as any).Deno.env.get('ALLOWED_IPS') : null)?.split(',') || [];
  const whitelist = [...DEFAULT_WHITELIST, ...envWhitelist];
  
  // Se for ambiente de desenvolvimento e o IP for local, permitir
  if (typeof (globalThis as any).Deno !== 'undefined' && (globalThis as any).Deno.env.get('ENVIRONMENT') !== 'production' && (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'unknown')) {
    return true;
  }

  return whitelist.includes(clientIP);
}

/**
 * Middleware para validar acesso por IP.
 */
export function validateIPAccess(req: Request): Response | null {
  if (!isIPAllowed(req)) {
    console.warn(`[Security] Access denied for IP: ${getClientIP(req.headers)}`);
    return new Response(
      JSON.stringify({ error: 'IP_NOT_ALLOWED', message: 'Access denied for this IP address' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
