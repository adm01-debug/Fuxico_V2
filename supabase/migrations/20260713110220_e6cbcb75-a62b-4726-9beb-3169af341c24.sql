
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND i.inhparent::regclass::text IN (
        'public.audit_logs','public.login_attempts','public.rate_limit_logs',
        'public.security_events','public.tracking_events','public.webhook_logs'
      )
  LOOP
    EXECUTE format('ALTER TABLE %s SET (
      autovacuum_vacuum_scale_factor = 0.05,
      autovacuum_analyze_scale_factor = 0.02,
      autovacuum_vacuum_threshold = 1000,
      autovacuum_analyze_threshold = 500
    )', r.tbl);
  END LOOP;
END$$;
