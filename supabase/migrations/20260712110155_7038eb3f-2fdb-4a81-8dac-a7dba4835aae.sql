-- =============================================================================
-- Safety net: statement/lock/idle timeouts por role
-- Simulação de cenários:
--   • anon executa apenas tracking pixel → 5s é folgado
--   • authenticated executa dashboards/RPCs → 15s cobre p99 confortavelmente
--   • service_role usado por Edge Functions em lote → mantém 0 (sem limite)
--   • postgres (jobs pg_cron: retention, refresh MV) → mantém 0
--   • lock_timeout global 3s evita deadlock storms em migrações
--   • idle_in_transaction 60s libera conexões vazadas do pooler
-- =============================================================================

ALTER ROLE anon           SET statement_timeout = '5s';
ALTER ROLE authenticated  SET statement_timeout = '15s';
ALTER ROLE service_role   SET statement_timeout = '0';

ALTER ROLE anon                       SET lock_timeout = '3s';
ALTER ROLE authenticated              SET lock_timeout = '3s';
ALTER ROLE service_role               SET lock_timeout = '5s';

ALTER ROLE anon                       SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE authenticated              SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE service_role               SET idle_in_transaction_session_timeout = '120s';
