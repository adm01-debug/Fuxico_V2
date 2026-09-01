-- pgTAP: garante RLS + FORCE RLS em todas as partições de tabelas sensíveis
-- Regressão para F-01 (auditoria back-end sênior 2026-07)
BEGIN;
SELECT plan(12);

-- Cada parent particionada deve ter TODAS as suas partições com RLS ativo
WITH parents(name) AS (
  VALUES
    ('public.audit_logs'),
    ('public.login_attempts'),
    ('public.security_events'),
    ('public.rate_limit_logs'),
    ('public.tracking_events'),
    ('public.webhook_logs')
)
SELECT is(
  (SELECT COUNT(*)::int
     FROM parents p
     JOIN pg_inherits i ON i.inhparent = p.name::regclass
     JOIN pg_class c ON c.oid = i.inhrelid
    WHERE c.relrowsecurity = false),
  0,
  'todas as partições têm RLS habilitado'
);

WITH parents(name) AS (
  VALUES
    ('public.audit_logs'),
    ('public.login_attempts'),
    ('public.security_events'),
    ('public.rate_limit_logs'),
    ('public.tracking_events'),
    ('public.webhook_logs')
)
SELECT is(
  (SELECT COUNT(*)::int
     FROM parents p
     JOIN pg_inherits i ON i.inhparent = p.name::regclass
     JOIN pg_class c ON c.oid = i.inhrelid
    WHERE c.relforcerowsecurity = false),
  0,
  'todas as partições têm FORCE ROW LEVEL SECURITY'
);

-- Admin functions não devem ser executáveis por authenticated
SELECT is(
  has_function_privilege('authenticated', 'public.admin_ops_dashboard()', 'EXECUTE'),
  false,
  'admin_ops_dashboard NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_table_bloat()', 'EXECUTE'),
  false,
  'admin_table_bloat NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_query_regressions(numeric)', 'EXECUTE'),
  false,
  'admin_query_regressions NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_blocking_queries()', 'EXECUTE'),
  false,
  'admin_blocking_queries NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_data_integrity_check()', 'EXECUTE'),
  false,
  'admin_data_integrity_check NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('authenticated', 'public.admin_index_usage()', 'EXECUTE'),
  false,
  'admin_index_usage NÃO executável por authenticated'
);
SELECT is(
  has_function_privilege('anon', 'public.admin_ops_dashboard()', 'EXECUTE'),
  false,
  'admin_ops_dashboard NÃO executável por anon'
);

-- Service role deve manter acesso
SELECT is(
  has_function_privilege('service_role', 'public.admin_ops_dashboard()', 'EXECUTE'),
  true,
  'service_role mantém acesso a admin_ops_dashboard'
);

-- ensure_future_partitions blindada
SELECT is(
  has_function_privilege('anon', 'public.ensure_future_partitions()', 'EXECUTE'),
  false,
  'ensure_future_partitions NÃO executável por anon'
);
SELECT is(
  has_function_privilege('authenticated', 'public.ensure_future_partitions()', 'EXECUTE'),
  false,
  'ensure_future_partitions NÃO executável por authenticated'
);

SELECT * FROM finish();
ROLLBACK;
