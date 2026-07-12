
BEGIN;

DROP TABLE public.webhook_logs CASCADE;

CREATE TABLE public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  webhook_id uuid,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  tracking_id text,
  payload jsonb,
  response_status integer,
  response_body text,
  error text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at),
  CONSTRAINT webhook_logs_webhook_id_fkey FOREIGN KEY (webhook_id)
    REFERENCES public.webhook_configs(id) ON DELETE SET NULL
) PARTITION BY RANGE (created_at);

GRANT SELECT, INSERT ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook logs"
ON public.webhook_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook logs"
ON public.webhook_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs (created_at DESC);
CREATE INDEX idx_webhook_logs_user_id ON public.webhook_logs (user_id);
CREATE INDEX idx_webhook_logs_user_created ON public.webhook_logs (user_id, created_at DESC);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs (webhook_id);
CREATE INDEX idx_webhook_logs_created_brin ON public.webhook_logs USING BRIN (created_at) WITH (pages_per_range = 64);

CREATE TABLE public.webhook_logs_2026_06 PARTITION OF public.webhook_logs FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.webhook_logs_2026_07 PARTITION OF public.webhook_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.webhook_logs_2026_08 PARTITION OF public.webhook_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE public.webhook_logs_2026_09 PARTITION OF public.webhook_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE public.webhook_logs_2026_10 PARTITION OF public.webhook_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE public.webhook_logs_2026_11 PARTITION OF public.webhook_logs FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.webhook_logs_2026_12 PARTITION OF public.webhook_logs FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE public.webhook_logs_2027_01 PARTITION OF public.webhook_logs FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE public.webhook_logs_default PARTITION OF public.webhook_logs DEFAULT;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.webhook_logs'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', r.relname);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_webhook_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('webhook_logs_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname=part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.webhook_logs FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', part_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
  END IF;
END; $fn$;

REVOKE EXECUTE ON FUNCTION public.ensure_webhook_logs_partition(date) FROM PUBLIC, anon, authenticated;

-- Extend retention cleanup: drop old webhook_logs partitions (>90d)
CREATE OR REPLACE FUNCTION public.run_retention_cleanup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE
  r record;
  cutoff_wl timestamptz := now() - interval '90 days';
  upper_ts timestamptz;
  upper_bound text;
BEGIN
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '90 days';
  DELETE FROM public.password_reset_tokens WHERE (used_at IS NOT NULL OR expires_at < now()) AND created_at < now() - interval '30 days';
  DELETE FROM public.email_verification_tokens WHERE (verified_at IS NOT NULL OR expires_at < now()) AND created_at < now() - interval '30 days';
  DELETE FROM public.webauthn_challenges WHERE expires_at < now() - interval '1 day';
  DELETE FROM public.blocked_ips WHERE expires_at IS NOT NULL AND expires_at < now() - interval '7 days';
  DELETE FROM public.rate_limit_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM public.login_lockouts WHERE (lockout_until IS NULL OR lockout_until < now() - interval '7 days') AND updated_at < now() - interval '7 days';

  -- Drop whole webhook_logs partitions older than 90d
  FOR r IN SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
           FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.webhook_logs'::regclass AND c.relname <> 'webhook_logs_default'
  LOOP
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff_wl THEN
      EXECUTE format('DROP TABLE public.%I', r.relname);
    END IF;
  END LOOP;
  DELETE FROM public.webhook_logs_default WHERE created_at < cutoff_wl;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.run_retention_cleanup() FROM PUBLIC, anon, authenticated;

COMMIT;

SELECT cron.schedule(
  'ensure_webhook_logs_partition_monthly',
  '5 2 25 * *',
  $$ SELECT public.ensure_webhook_logs_partition((date_trunc('month', now()) + interval '1 month')::date); $$
);
