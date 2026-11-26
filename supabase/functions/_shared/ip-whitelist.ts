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
  const denoGlobal = (globalThis as { Deno?: { env: { get(key: string): string | undefined } } }).Deno;
  const envWhitelist = (denoGlobal ? denoGlobal.env.get('ALLOWED_IPS') : null)?.split(',') || [];
  const whitelist = [...DEFAULT_WHITELIST, ...envWhitelist];
  
  // Se for ambiente de desenvolvimento e o IP for local, permitir
  if (denoGlobal && denoGlobal.env.get('ENVIRONMENT') !== 'production' && (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'unknown')) {
    return true;
  }

  return whitelist.includes(clientIP);
}

/**
 * Requisicao traz credencial de usuario (JWT) no header Authorization.
 * A whitelist de IP nao serve como autorizacao para funcoes de usuario final: o
 * IP do cliente varia e a lista padrao (127.0.0.1/::1) respondia 403 para todo
 * mundo, deixando 21 funcoes inalcancaveis em producao (o mesmo problema ja
 * documentado em cleanup-security-data). Requisicoes autenticadas seguem para a
 * validacao de JWT/role dentro de cada funcao; o bloqueio por IP fica restrito
 * ao trafego anonimo.
 */
export function hasBearerToken(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  return Boolean(authHeader && /^Bearer\s+\S+$/i.test(authHeader));
}

/**
 * Middleware para validar acesso por IP.
 */
export function validateIPAccess(req: Request): Response | null {
  if (hasBearerToken(req)) return null;

  if (!isIPAllowed(req)) {
    console.warn(`[Security] Access denied for IP: ${getClientIP(req.headers)}`);
    return new Response(
      JSON.stringify({ error: 'IP_NOT_ALLOWED', message: 'Access denied for this IP address' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
