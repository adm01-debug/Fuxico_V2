
-- =============================================================================
-- Onda 1.2 — Particionar audit_logs por mês
-- =============================================================================

BEGIN;

-- 1. Renomear tabela antiga
ALTER TABLE public.audit_logs RENAME TO audit_logs_old;
ALTER TABLE public.audit_logs_old RENAME CONSTRAINT audit_logs_pkey TO audit_logs_old_pkey;
ALTER TABLE public.audit_logs_old RENAME CONSTRAINT audit_logs_severity_check TO audit_logs_old_severity_check;
ALTER TABLE public.audit_logs_old RENAME CONSTRAINT audit_logs_user_id_fkey TO audit_logs_old_user_id_fkey;

-- 2. Criar tabela particionada
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info','warning','error','critical')),
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 3. Criar partições mensais 2026-06 → 2027-01 + default
CREATE TABLE public.audit_logs_2026_06 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.audit_logs_2026_07 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.audit_logs_2026_08 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE public.audit_logs_2026_09 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE public.audit_logs_2026_10 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE public.audit_logs_2026_11 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.audit_logs_2026_12 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE public.audit_logs_2027_01 PARTITION OF public.audit_logs FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE public.audit_logs_default PARTITION OF public.audit_logs DEFAULT;

-- 4. Migrar dados
INSERT INTO public.audit_logs (id, user_id, event_type, severity, description, metadata, ip_address, user_agent, created_at)
SELECT id, user_id, event_type, COALESCE(severity,'info'), description, COALESCE(metadata,'{}'::jsonb), ip_address, user_agent, COALESCE(created_at, now())
FROM public.audit_logs_old;

-- 5. GRANTs (equivalente ao original — audit_logs é auth-only)
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- 6. RLS + policy original
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Índices
CREATE INDEX audit_logs_created_at_desc_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_user_id_idx ON public.audit_logs (user_id);
CREATE INDEX audit_logs_user_created_idx ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX audit_logs_event_type_idx ON public.audit_logs (event_type);
CREATE INDEX audit_logs_created_brin_idx ON public.audit_logs USING BRIN (created_at);

-- 8. Autovacuum + fillfactor + FORCE RLS em cada partição
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname
           FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
           WHERE i.inhparent = 'public.audit_logs'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', r.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- 9. Drop tabela antiga
DROP TABLE public.audit_logs_old;

COMMIT;

-- 10. Função para provisionar partições futuras
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
  END IF;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.ensure_audit_logs_partition(date) FROM PUBLIC, anon, authenticated;

-- 11. Extender run_retention_cleanup para dropar partições >365d de audit_logs
CREATE OR REPLACE FUNCTION public.run_retention_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  cutoff_wl timestamptz := now() - interval '90 days';
  cutoff_al timestamptz := now() - interval '365 days';
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

  -- webhook_logs (>90d)
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

  -- audit_logs (>365d)
  FOR r IN SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
           FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.audit_logs'::regclass AND c.relname <> 'audit_logs_default'
  LOOP
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff_al THEN
      EXECUTE format('DROP TABLE public.%I', r.relname);
    END IF;
  END LOOP;
  DELETE FROM public.audit_logs_default WHERE created_at < cutoff_al;
END;
$function$;

-- 12. Agendar cron mensal para provisionar próxima partição
SELECT cron.schedule(
  'ensure-audit-logs-partition-monthly',
  '10 2 25 * *',
  $$ SELECT public.ensure_audit_logs_partition((date_trunc('month', now()) + interval '2 months')::date); $$
);
