-- Onda 76: revoga EXECUTE de PUBLIC/anon/authenticated em funções internas
DO $$
DECLARE
  fn text;
  sig text;
  fns text[] := ARRAY[
    'monitor_cron_jobs()',
    'monitor_table_bloat()',
    'alert_query_regressions()',
    'capture_index_usage_snapshot()',
    'capture_query_performance_snapshot()',
    'ensure_future_partitions()',
    'run_tracking_events_retention()',
    'cleanup_expired_challenges()',
    'log_audit_event(uuid, text, text, text, jsonb)',
    'check_stagnant_indexes(integer, integer)',
    'record_login_attempt(text, text, boolean, text, jsonb)',
    'check_login_attempts(text, text, integer, integer)',
    'increment_sequence_completed(uuid)'
  ];
BEGIN
  FOREACH sig IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', sig);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip %', sig;
    END;
  END LOOP;
END $$;