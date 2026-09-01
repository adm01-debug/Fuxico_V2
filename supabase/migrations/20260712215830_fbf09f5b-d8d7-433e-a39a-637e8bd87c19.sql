-- Onda 26: REVOKE admin_* e db_health_check de authenticated (defesa de superfície)
DO $$
DECLARE
  f text;
  funcs text[] := ARRAY[
    'admin_blocking_queries()',
    'admin_data_integrity_check()',
    'admin_index_usage()',
    'admin_ops_dashboard()',
    'admin_query_regressions(numeric)',
    'admin_table_bloat()',
    'reset_slow_query_stats()'
  ];
BEGIN
  FOREACH f IN ARRAY funcs LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip missing function: %', f;
    END;
  END LOOP;
END $$;

-- db_health_check se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='db_health_check' AND pronamespace='public'::regnamespace) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.db_health_check() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.db_health_check() TO service_role';
  END IF;
END $$;