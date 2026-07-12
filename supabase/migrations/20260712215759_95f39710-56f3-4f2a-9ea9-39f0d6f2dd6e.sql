-- Onda 25: Backfill RLS em partições legadas + hardening idempotente
DO $$
DECLARE
  r record;
  parents text[] := ARRAY[
    'public.audit_logs',
    'public.login_attempts',
    'public.security_events',
    'public.rate_limit_logs',
    'public.tracking_events',
    'public.webhook_logs'
  ];
  p text;
BEGIN
  FOREACH p IN ARRAY parents LOOP
    FOR r IN
      SELECT c.oid, n.nspname, c.relname
      FROM pg_inherits i
      JOIN pg_class c ON c.oid = i.inhrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE i.inhparent = p::regclass
    LOOP
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.nspname, r.relname);
      EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.nspname, r.relname);
    END LOOP;
  END LOOP;
END $$;

-- Idempotência: garantir RLS mesmo quando a partição já existe
CREATE OR REPLACE FUNCTION public.ensure_audit_logs_partition(target_month date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('audit_logs_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.audit_logs FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', part_name);
  END IF;
  -- SEMPRE reforçar RLS (idempotente)
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
END; $function$;

REVOKE ALL ON FUNCTION public.ensure_audit_logs_partition(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_audit_logs_partition(date) TO service_role;