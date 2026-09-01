
CREATE OR REPLACE FUNCTION public.ensure_audit_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('audit_logs_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.audit_logs FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', part_name);
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_login_attempts_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('login_attempts_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.login_attempts FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', part_name);
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_rate_limit_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('rate_limit_logs_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.rate_limit_logs FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', part_name);
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_security_events_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('security_events_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.security_events FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', part_name);
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_tracking_events_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('tracking_events_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.tracking_events FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', part_name);
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_webhook_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('webhook_logs_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.webhook_logs FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', part_name);
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
END; $$;
