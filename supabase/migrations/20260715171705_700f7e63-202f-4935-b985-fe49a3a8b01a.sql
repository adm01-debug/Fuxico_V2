
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.admin_data_integrity_check()',
    'public.admin_table_bloat()',
    'public.admin_blocking_queries()',
    'public.admin_stale_indexes(integer)',
    'public.admin_index_ranking(integer,integer)',
    'public.admin_list_cron_failures(integer)',
    'public.db_health_check()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET statement_timeout = ''2s''', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip %', fn;
    END;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_security_events_critical_by_user
  ON public.security_events (user_id, created_at DESC)
  WHERE severity IN ('high','critical');
