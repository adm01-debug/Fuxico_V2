-- =============================================================================
-- Hardening: PII de tracking exposta a anon e EXECUTE publico em funcoes internas
--
-- Projeto de producao: xmyvefffgltlrobazrmg
--
-- Evidencias coletadas por probe real com a chave publica (sem login), ANTES do fix:
--
--  1) POST /rest/v1/rpc/exec_sql {"query":"select 1 as x"}        -> HTTP 200 [{"x":1}]
--     `exec_sql(text)` e SECURITY DEFINER e sua unica guarda era
--     `IF current_user NOT IN ('postgres','supabase_admin','service_role')`.
--     Dentro de SECURITY DEFINER `current_user` e sempre o owner (postgres), portanto a
--     guarda nunca disparava: qualquer pessoa na internet tinha SQL arbitrario como owner.
--     DEPOIS: HTTP 401 {"code":"42501","message":"permission denied for function exec_sql"}.
--
--  2) GET /rest/v1/v_tracking_summary?select=tracking_id,recipient_email  -> HTTP 206 com PII
--     A view nao tinha `security_invoker`, logo lia as tabelas base como owner e ignorava
--     a RLS: entregava recipient_email/subject/tracking_id de TODOS os tenants para anon,
--     enquanto a tabela base `tracked_emails` devolvia [] (RLS funcionando).
--     DEPOIS: [] (HTTP 200).
--
--  3) POST /rest/v1/rpc/update_contact_score {"p_user_id":"<uuid alheio>", ...} -> HTTP 200
--     POST /rest/v1/rpc/recalculate_all_contact_scores {"p_user_id":"<uuid alheio>"} -> HTTP 200
--     POST /rest/v1/rpc/admin_system_health_score {} -> HTTP 200 com metricas internas
--     Mesma causa raiz nos auxiliares: `is_service_context()` decidia por `current_user`,
--     que dentro de qualquer SECURITY DEFINER e o owner. Toda guarda escrita como
--     `has_role(auth.uid(),'admin') OR is_service_context()` era portanto sempre verdadeira.
--     DEPOIS: HTTP 401 {"code":"42501","message":"forbidden"} nos tres.
--
-- Alem disso, 5 views `admin_*` estavam legiveis por anon e a tabela `entity_versions`
-- tinha policy de SELECT `USING (true)` para o papel `public`.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) View de tracking: passa a respeitar a RLS do chamador
-- ---------------------------------------------------------------------------
ALTER VIEW public.v_tracking_summary SET (security_invoker = on);

-- ---------------------------------------------------------------------------
-- 2) Views administrativas nao devem ser legiveis por anon
-- ---------------------------------------------------------------------------
DO $mig$
DECLARE
  v_view text;
BEGIN
  FOREACH v_view IN ARRAY ARRAY[
    'admin_cache_hit_ratio', 'admin_cron_status', 'admin_partition_coverage',
    'admin_slow_queries', 'admin_table_health'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_view AND c.relkind = 'v'
    ) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v_view);
    END IF;
  END LOOP;
END $mig$;

-- ---------------------------------------------------------------------------
-- 3) entity_versions: troca a policy permissiva por escopo de dono/papel
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view versions" ON public.entity_versions;
DROP POLICY IF EXISTS "Authenticated users can view versions" ON public.entity_versions;
CREATE POLICY "Authenticated users can view versions"
  ON public.entity_versions
  FOR SELECT
  TO authenticated
  USING (
    changed_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ---------------------------------------------------------------------------
-- 4) is_service_context(): deixa de confiar em `current_user`
--    O contexto de servico passa a ser o papel do JWT (PostgREST) ou, quando nao ha
--    JWT nenhum (SQL direto, pg_cron, psql), o `session_user` da conexao -- que em
--    chamadas REST e o `authenticator`, nunca o owner de uma funcao SECURITY DEFINER.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_service_context()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
           NULLIF(current_setting('request.jwt.claim.role', true), ''),
           NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), ''),
           CASE
             WHEN NULLIF(current_setting('request.jwt.claims', true), '') IS NULL
              AND NULLIF(current_setting('request.jwt.claim.role', true), '') IS NULL
              AND session_user IN ('postgres', 'supabase_admin', 'service_role')
             THEN 'service_role'
             ELSE ''
           END
         ) = 'service_role';
$function$;

-- ---------------------------------------------------------------------------
-- 5) exec_sql(): guarda passa a usar is_service_context()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
 RETURNS SETOF json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r record;
BEGIN
  IF NOT public.is_service_context() THEN
    RAISE EXCEPTION 'exec_sql: forbidden' USING ERRCODE = '42501';
  END IF;
  FOR r IN EXECUTE query LOOP
    RETURN NEXT row_to_json(r);
  END LOOP;
  RETURN;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 6) EXECUTE das funcoes SECURITY DEFINER: deny-by-default
--
-- Somente estas podem ser chamadas direto pelo front/REST:
--   * anon + authenticated -> fluxo pre-login (lockout, reset de senha, webauthn,
--     verificacao de e-mail) e leituras auto-escopadas por auth.uid().
--   * authenticated        -> recursos de usuario logado (MFA, permissoes).
-- Todo o resto (rotinas admin_*, cron, webhook, particionamento, retencao, indices)
-- fica exclusivo de service_role -- consumido pelo proxy `admin-rpc` e pelas edge functions.
-- ---------------------------------------------------------------------------
DO $mig$
DECLARE
  r record;
  v_anon text[] := ARRAY[
    'admin_system_health_score', 'check_lockout_status', 'check_login_attempts',
    'create_webauthn_challenge', 'get_due_reminders', 'get_emails_with_stats',
    'get_geo_stats', 'get_lockout_status', 'get_user_tracking_stats', 'has_permission',
    'has_role', 'manage_email_verification_token', 'recalculate_all_contact_scores',
    'record_failed_login', 'record_login_attempt', 'update_contact_score',
    'use_password_reset_token', 'verify_email_token', 'verify_webauthn_challenge'
  ];
  v_auth text[] := ARRAY[
    'compute_adaptive_limit', 'consume_mfa_backup_code', 'generate_mfa_backup_codes',
    'get_user_permissions', 'reset_login_lockout'
  ];
BEGIN
  -- permissoes explicitas da allowlist de anon
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY (v_anon)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', r.sig);
  END LOOP;

  -- allowlist de usuario autenticado (sem anon)
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname = ANY (v_auth) AND NOT (p.proname = ANY (v_anon))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;

  -- todo o restante: somente service_role
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND NOT (p.proname = ANY (v_anon)) AND NOT (p.proname = ANY (v_auth))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $mig$;
