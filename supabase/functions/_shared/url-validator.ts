// =============================================================================
// FUXICO - URL Validator
// Arquivo: supabase/functions/_shared/url-validator.ts
// Descricao: Validacao de URLs para prevenir SSRF e Open Redirect
// =============================================================================

/**
 * Lista de ranges de IP privados (RFC 1918 + loopback + link-local + metadata)
 */
const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // Loopback
  /^10\./,                           // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./,     // Class B private
  /^192\.168\./,                     // Class C private
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 private
  /^fe80:/i,                         // IPv6 link-local
];

/**
 * Hostnames proibidos (metadata services, localhost variants)
 */
const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- AWS/GCP metadata IP is a well-known SSRF vector we must block
  '169.254.169.254',
  '[::1]',
];

/**
 * Verifica se uma URL e segura para redirecionamento ou fetch externo.
 * Bloqueia: IPs privados, localhost, metadata services, protocolos inseguros.
 */
export function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Apenas HTTPS e HTTP permitidos
    if (!['https:', 'http:'].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Bloquear hostnames conhecidos
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    // Bloquear IPs privados
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Bloquear URLs com credenciais embutidas
    if (url.username || url.password) {
      return false;
    }

    return true;
  } catch {
    // URL invalida
    return false;
  }
}

/**
 * Valida uma URL de webhook para uso seguro.
 * Mais restritivo que isUrlSafe - exige HTTPS em producao.
 */
export function isWebhookUrlSafe(urlString: string): boolean {
  if (!isUrlSafe(urlString)) return false;

  try {
    const url = new URL(urlString);

    // Em producao, exigir HTTPS para webhooks
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
    return !(isProduction && url.protocol !== 'https:');
  } catch {
    return false;
  }
}
