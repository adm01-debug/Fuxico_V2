-- =============================================================================
-- FUXICO — pgTAP: Onda 140 (hardening de SECURITY DEFINER)
--
-- Invariantes:
--   1. admin_system_health_score exige papel admin (guarda no corpo) e não é
--      executável por anon.
--   2. O corpo real (impl) é exclusivo de service_role.
--   3. Rotinas admin_* consumidas pelo proxy admin-rpc não são executáveis por
--      anon/authenticated.
--   4. O fluxo de lockout (pré-autenticação) continua acessível a anon —
--      regressão da Onda 133 que desativava a proteção contra brute force.
--   5. As funções de lockout validam formato de e-mail antes de gravar.
-- =============================================================================

BEGIN;
SELECT plan(13);

-- 1. Health score
SELECT is(
  has_function_privilege('anon', 'public.admin_system_health_score()', 'EXECUTE'),
  false,
  'admin_system_health_score NÃO executável por anon'
);
SELECT ok(
  (SELECT pg_get_functiondef(oid) ILIKE '%has_role(auth.uid()%'
     FROM pg_proc
    WHERE proname = 'admin_system_health_score'
      AND pronamespace = 'public'::regnamespace),
  'admin_system_health_score valida papel admin no corpo'
);

-- 2. Implementação interna restrita
SELECT is(
  has_function_privilege('authenticated', 'public.admin_system_health_score_impl()', 'EXECUTE'),
  false,
  'admin_system_health_score_impl NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('service_role', 'public.admin_system_health_score_impl()', 'EXECUTE'),
  true,
  'service_role mantém acesso ao corpo do health score'
);

-- 3. Rotinas admin_* via proxy admin-rpc
SELECT is(
  has_function_privilege('authenticated', 'public.admin_webhook_circuit_dashboard()', 'EXECUTE'),
  false,
  'admin_webhook_circuit_dashboard NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_reset_webhook_circuit(uuid)', 'EXECUTE'),
  false,
  'admin_reset_webhook_circuit NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_run_index_advisor()', 'EXECUTE'),
  false,
  'admin_run_index_advisor NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_cleanup_index_advisor_runs()', 'EXECUTE'),
  false,
  'admin_cleanup_index_advisor_runs NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('service_role', 'public.admin_webhook_circuit_dashboard()', 'EXECUTE'),
  true,
  'service_role mantém acesso ao painel de circuit breakers'
);

-- 4. Fluxo de lockout acessível pré-autenticação
SELECT is(
  has_function_privilege('anon', 'public.check_lockout_status(text, text)', 'EXECUTE'),
  true,
  'check_lockout_status executável por anon (fluxo de login)'
);
SELECT is(
  has_function_privilege('anon', 'public.record_failed_login(text, text)', 'EXECUTE'),
  true,
  'record_failed_login executável por anon (proteção brute force)'
);

-- 5. Validação de entrada — e-mail inválido não cria linha de lockout
SELECT is(
  (SELECT total_attempts FROM public.record_failed_login('  NOT-an-email  ', NULL)),
  0,
  'record_failed_login ignora e-mail com formato inválido'
);
SELECT is(
  (SELECT count(*)::int FROM public.login_lockouts WHERE email ILIKE '%NOT-an-email%'),
  0,
  'nenhuma linha de lockout criada para entrada inválida'
);

SELECT * FROM finish();
ROLLBACK;
