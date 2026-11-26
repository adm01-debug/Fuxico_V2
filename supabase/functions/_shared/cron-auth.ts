// =============================================================================
// FUXICO - Autorizacao de chamadas disparadas por cron
// Arquivo: supabase/functions/_shared/cron-auth.ts
//
// Segue o padrao que o job 12 do pg_cron ja usava: o token vive em
// public.internal_config e o proprio cron o resolve no momento do disparo,
// enviando-o no header `x-cron-secret`. Nenhum segredo fica no repositorio.
//
// Fail-closed: sem token configurado, a funcao recusa a chamada (503).
// =============================================================================

export const CRON_SECRET_HEADER = 'x-cron-secret';
export const CRON_SECRET_CONFIG_KEY = 'cron_secret';
export const CRON_SECRET_ENV = 'CRON_SECRET';

export type CronAuthResult = 'ok' | 'unauthorized' | 'not_configured';

/**
 * Compara duas strings sem vazar o tempo de resposta por prefixo comum.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkCronAuth(
  req: Request,
  expected: readonly (string | null | undefined)[],
): CronAuthResult {
  const candidates = expected.filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (candidates.length === 0) return 'not_configured';
  const provided = req.headers.get(CRON_SECRET_HEADER) ?? '';
  if (!provided) return 'unauthorized';
  let match = false;
  for (const candidate of candidates) {
    if (timingSafeEqual(provided, candidate)) match = true;
  }
  return match ? 'ok' : 'unauthorized';
}

/**
 * Segredo legado em variavel de ambiente. Continua aceito para nao quebrar
 * quem ja o tenha configurado, mas nao e necessario: o token do banco basta.
 */
function envCronSecret(): string | null {
  if (typeof Deno === 'undefined') return null;
  return Deno.env.get(CRON_SECRET_ENV) ?? null;
}

/**
 * Busca o token no banco e devolve o resultado da checagem.
 * O chamador decide o status HTTP da recusa.
 */
export async function verifyCronRequest(
  req: Request,
  // SupabaseClient estrutural: evita acoplar o helper a uma versao do SDK
  admin: { from(table: string): unknown },
): Promise<CronAuthResult> {
  try {
    const query = admin.from('internal_config') as {
      select(columns: string): {
        eq(column: string, value: string): {
          maybeSingle(): Promise<{ data: { value?: string | null } | null; error: unknown }>;
        };
      };
    };
    const { data, error } = await query
      .select('value')
      .eq('key', CRON_SECRET_CONFIG_KEY)
      .maybeSingle();
    if (error) return checkCronAuth(req, [envCronSecret()]);
    return checkCronAuth(req, [data?.value ?? null, envCronSecret()]);
  } catch {
    return 'not_configured';
  }
}

export function cronAuthStatus(result: CronAuthResult): number {
  return result === 'unauthorized' ? 401 : 503;
}

export function cronAuthError(result: CronAuthResult): string {
  return result === 'unauthorized' ? 'Unauthorized' : 'cron secret not configured';
}