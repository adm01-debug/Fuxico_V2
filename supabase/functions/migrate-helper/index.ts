// =============================================================================
// FUXICO — migrate-helper
// Utilitário administrativo para inspeção do ambiente de migração.
//
// SEGURANÇA (decisões explícitas):
//  - Acesso exige JWT válido + papel `admin` (verificado via RPC `has_role`).
//  - A antiga action "credentials" foi REMOVIDA: expor SUPABASE_SERVICE_ROLE_KEY
//    por HTTP é uma vulnerabilidade crítica (comprometimento total do banco).
//  - Nenhum segredo é retornado; apenas metadados booleanos de presença.
// =============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type JsonBody = Record<string, unknown>;

const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' };

function json(body: JsonBody, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Ações suportadas pela função. */
const ACTIONS = ['ping', 'env-check', 'db-check'] as const;
type Action = (typeof ACTIONS)[number];

function isAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  // ---------------------------------------------------------------------------
  // 1. Autenticação — JWT obrigatório
  // ---------------------------------------------------------------------------
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'unauthorized' }, 401);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.slice('Bearer '.length);
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return json({ error: 'unauthorized' }, 401);
  }
  const userId = String(claimsData.claims.sub);

  // ---------------------------------------------------------------------------
  // 2. Autorização — apenas admin
  // ---------------------------------------------------------------------------
  const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });
  if (roleError) {
    return json({ error: 'authorization_check_failed' }, 500);
  }
  if (isAdmin !== true) {
    return json({ error: 'forbidden' }, 403);
  }

  // ---------------------------------------------------------------------------
  // 3. Ação
  // ---------------------------------------------------------------------------
  const rawAction = new URL(req.url).searchParams.get('action') ?? 'ping';
  if (!isAction(rawAction)) {
    return json({ error: 'unknown_action', allowed: ACTIONS }, 400);
  }

  try {
    if (rawAction === 'ping') {
      return json({ ok: true, action: 'ping', timestamp: new Date().toISOString() });
    }

    if (rawAction === 'env-check') {
      // Apenas presença — nunca valores.
      const names = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_DB_URL',
      ];
      const present: Record<string, boolean> = {};
      for (const name of names) {
        present[name] = Boolean(Deno.env.get(name));
      }
      return json({ ok: true, action: 'env-check', present });
    }

    // db-check: valida conectividade da Data API com o JWT do chamador.
    const { error: dbError } = await supabase
      .from('user_roles')
      .select('id', { count: 'exact', head: true });

    return json({
      ok: !dbError,
      action: 'db-check',
      database: dbError ? 'error' : 'connected',
      ...(dbError ? { detail: dbError.message } : {}),
    }, dbError ? 503 : 200);
  } catch (err) {
    console.error('migrate-helper failure', err instanceof Error ? err.message : err);
    return json({ error: 'internal_error' }, 500);
  }
});
