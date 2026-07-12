-- =============================================================================
-- FUXICO — pgTAP: valida particionamento (Onda 1), version columns (Onda 2)
-- e materialized view email_stats_mv (Onda 4).
-- =============================================================================
BEGIN;
SELECT plan(28);

-- 1) Tabelas particionadas por RANGE(created_at)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'webhook_logs','audit_logs','rate_limit_logs','security_events','login_attempts','tracking_events'
  ] LOOP
    PERFORM ok(
      (SELECT c.relkind = 'p' FROM pg_class c
        WHERE c.relname = t AND c.relnamespace = 'public'::regnamespace),
      format('%s é PARTITIONED TABLE', t)
    );
    PERFORM ok(
      (SELECT COUNT(*) >= 6 FROM pg_inherits i
        WHERE i.inhparent = ('public.'||t)::regclass),
      format('%s tem ao menos 6 partições', t)
    );
  END LOOP;
END$$;

-- 2) Version columns + triggers em tabelas críticas
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'campaigns','email_sequences','tracked_emails','email_templates',
    'scheduled_emails','sequence_enrollments','sequence_steps','ab_tests',
    'webhook_configs','user_preferences','feature_flags'
  ] LOOP
    PERFORM ok(
      (SELECT COUNT(*) = 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=t AND column_name='version'),
      format('%s possui coluna version', t)
    );
  END LOOP;
END$$;

-- 3) EXCLUDE constraints anti-duplicata
SELECT ok(
  EXISTS(SELECT 1 FROM pg_constraint
          WHERE conname='scheduled_emails_no_dup_pending' AND contype='x'),
  'scheduled_emails possui EXCLUDE anti-duplicata'
);
SELECT ok(
  EXISTS(SELECT 1 FROM pg_constraint
          WHERE conname LIKE 'sequence_enrollments_no_dup%' AND contype='x'),
  'sequence_enrollments possui EXCLUDE anti-duplicata'
);

-- 4) email_stats_mv presente + índice único para CONCURRENTLY
SELECT ok(
  EXISTS(SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='email_stats_mv'),
  'email_stats_mv existe'
);
SELECT ok(
  EXISTS(SELECT 1 FROM pg_indexes
          WHERE schemaname='public' AND tablename='email_stats_mv' AND indexdef ILIKE '%UNIQUE%'),
  'email_stats_mv possui índice UNIQUE (REFRESH CONCURRENTLY)'
);

-- 5) Job pg_cron de refresh agendado
SELECT ok(
  EXISTS(SELECT 1 FROM cron.job WHERE jobname='refresh-email-stats-mv'),
  'refresh-email-stats-mv agendado no pg_cron'
);

SELECT finish();
ROLLBACK;
