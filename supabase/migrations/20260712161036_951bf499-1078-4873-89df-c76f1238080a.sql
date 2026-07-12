
-- Onda 1.3: Particionar rate_limit_logs, security_events, login_attempts por mês

-- =========================================================================
-- RATE_LIMIT_LOGS
-- =========================================================================
ALTER TABLE public.rate_limit_logs RENAME TO rate_limit_logs_old;

CREATE TABLE public.rate_limit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_end timestamptz NOT NULL,
  is_blocked boolean DEFAULT false,
  user_id uuid,
  user_agent text,
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

INSERT INTO public.rate_limit_logs
  SELECT id, ip_address, endpoint, request_count, window_start, window_end,
         is_blocked, user_id, user_agent, country, city, created_at
  FROM public.rate_limit_logs_old;

DROP TABLE public.rate_limit_logs_old;

CREATE TABLE public.rate_limit_logs_default PARTITION OF public.rate_limit_logs DEFAULT;

DO $$
DECLARE m date;
BEGIN
  FOR m IN SELECT generate_series(date_trunc('month', now())::date - interval '2 months',
                                  date_trunc('month', now())::date + interval '6 months',
                                  interval '1 month')::date LOOP
    EXECUTE format('CREATE TABLE public.rate_limit_logs_%s PARTITION OF public.rate_limit_logs FOR VALUES FROM (%L) TO (%L)',
      to_char(m,'YYYY_MM'), m, (m + interval '1 month')::date);
  END LOOP;
END$$;

CREATE INDEX idx_rate_limit_logs_created_at ON public.rate_limit_logs(created_at DESC);
CREATE INDEX idx_rate_limit_logs_ip_endpoint ON public.rate_limit_logs(ip_address, endpoint, created_at DESC);
CREATE INDEX idx_rate_limit_logs_brin ON public.rate_limit_logs USING BRIN (created_at);

ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.rate_limit_logs TO authenticated;
GRANT ALL ON public.rate_limit_logs TO service_role;

CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert rate limit logs" ON public.rate_limit_logs
  FOR INSERT WITH CHECK (ip_address IS NOT NULL AND ip_address <> '' AND endpoint IS NOT NULL);

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.rate_limit_logs'::regclass LOOP
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', p.relname);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p.relname);
  END LOOP;
END$$;

CREATE OR REPLACE FUNCTION public.ensure_rate_limit_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('rate_limit_logs_%s', to_char(start_date,'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname=part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.rate_limit_logs FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', part_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
  END IF;
END$$;

REVOKE EXECUTE ON FUNCTION public.ensure_rate_limit_logs_partition(date) FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- SECURITY_EVENTS
-- =========================================================================
ALTER TABLE public.security_events RENAME TO security_events_old;

CREATE TABLE public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  description text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

INSERT INTO public.security_events
  SELECT id, user_id, event_type, severity, description, ip_address, user_agent, metadata, created_at
  FROM public.security_events_old;

DROP TABLE public.security_events_old;

CREATE TABLE public.security_events_default PARTITION OF public.security_events DEFAULT;

DO $$
DECLARE m date;
BEGIN
  FOR m IN SELECT generate_series(date_trunc('month', now())::date - interval '2 months',
                                  date_trunc('month', now())::date + interval '6 months',
                                  interval '1 month')::date LOOP
    EXECUTE format('CREATE TABLE public.security_events_%s PARTITION OF public.security_events FOR VALUES FROM (%L) TO (%L)',
      to_char(m,'YYYY_MM'), m, (m + interval '1 month')::date);
  END LOOP;
END$$;

CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity) WHERE severity IN ('warning','critical','error');
CREATE INDEX idx_security_events_brin ON public.security_events USING BRIN (created_at);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

CREATE POLICY "Users can view their own security events" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can insert own security events" ON public.security_events
  FOR INSERT TO authenticated WITH CHECK (
    event_type IS NOT NULL AND description IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
  );

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.security_events'::regclass LOOP
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', p.relname);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p.relname);
  END LOOP;
END$$;

CREATE OR REPLACE FUNCTION public.ensure_security_events_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('security_events_%s', to_char(start_date,'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname=part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.security_events FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', part_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
  END IF;
END$$;

REVOKE EXECUTE ON FUNCTION public.ensure_security_events_partition(date) FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- LOGIN_ATTEMPTS
-- =========================================================================
ALTER TABLE public.login_attempts RENAME TO login_attempts_old;

CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

INSERT INTO public.login_attempts
  SELECT id, email, ip_address, success, user_agent, metadata, created_at
  FROM public.login_attempts_old;

DROP TABLE public.login_attempts_old;

CREATE TABLE public.login_attempts_default PARTITION OF public.login_attempts DEFAULT;

DO $$
DECLARE m date;
BEGIN
  FOR m IN SELECT generate_series(date_trunc('month', now())::date - interval '2 months',
                                  date_trunc('month', now())::date + interval '6 months',
                                  interval '1 month')::date LOOP
    EXECUTE format('CREATE TABLE public.login_attempts_%s PARTITION OF public.login_attempts FOR VALUES FROM (%L) TO (%L)',
      to_char(m,'YYYY_MM'), m, (m + interval '1 month')::date);
  END LOOP;
END$$;

CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address, created_at DESC);
CREATE INDEX idx_login_attempts_failed ON public.login_attempts(email, created_at DESC) WHERE success = false;
CREATE INDEX idx_login_attempts_brin ON public.login_attempts USING BRIN (created_at);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.login_attempts TO authenticated;
GRANT ALL ON public.login_attempts TO service_role;

CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.login_attempts'::regclass LOOP
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', p.relname);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p.relname);
  END LOOP;
END$$;

CREATE OR REPLACE FUNCTION public.ensure_login_attempts_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name text := format('login_attempts_%s', to_char(start_date,'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname=part_name AND relkind='r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.login_attempts FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.1, autovacuum_analyze_scale_factor=0.05, fillfactor=90)', part_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
  END IF;
END$$;

REVOKE EXECUTE ON FUNCTION public.ensure_login_attempts_partition(date) FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- Retention update: drop old partitions instead of DELETE
-- =========================================================================
CREATE OR REPLACE FUNCTION public.run_retention_cleanup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  r record;
  cutoff_wl timestamptz := now() - interval '90 days';
  cutoff_al timestamptz := now() - interval '365 days';
  cutoff_rll timestamptz := now() - interval '30 days';
  cutoff_se timestamptz := now() - interval '180 days';
  cutoff_la timestamptz := now() - interval '90 days';
  upper_ts timestamptz;
  upper_bound text;
BEGIN
  DELETE FROM public.password_reset_tokens WHERE (used_at IS NOT NULL OR expires_at < now()) AND created_at < now() - interval '30 days';
  DELETE FROM public.email_verification_tokens WHERE (verified_at IS NOT NULL OR expires_at < now()) AND created_at < now() - interval '30 days';
  DELETE FROM public.webauthn_challenges WHERE expires_at < now() - interval '1 day';
  DELETE FROM public.blocked_ips WHERE expires_at IS NOT NULL AND expires_at < now() - interval '7 days';
  DELETE FROM public.login_lockouts WHERE (lockout_until IS NULL OR lockout_until < now() - interval '7 days') AND updated_at < now() - interval '7 days';

  -- webhook_logs (>90d)
  FOR r IN SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
           FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.webhook_logs'::regclass AND c.relname <> 'webhook_logs_default' LOOP
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff_wl THEN EXECUTE format('DROP TABLE public.%I', r.relname); END IF;
  END LOOP;
  DELETE FROM public.webhook_logs_default WHERE created_at < cutoff_wl;

  -- audit_logs (>365d)
  FOR r IN SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
           FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.audit_logs'::regclass AND c.relname <> 'audit_logs_default' LOOP
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff_al THEN EXECUTE format('DROP TABLE public.%I', r.relname); END IF;
  END LOOP;
  DELETE FROM public.audit_logs_default WHERE created_at < cutoff_al;

  -- rate_limit_logs (>30d)
  FOR r IN SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
           FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.rate_limit_logs'::regclass AND c.relname <> 'rate_limit_logs_default' LOOP
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff_rll THEN EXECUTE format('DROP TABLE public.%I', r.relname); END IF;
  END LOOP;
  DELETE FROM public.rate_limit_logs_default WHERE created_at < cutoff_rll;

  -- security_events (>180d)
  FOR r IN SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
           FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.security_events'::regclass AND c.relname <> 'security_events_default' LOOP
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff_se THEN EXECUTE format('DROP TABLE public.%I', r.relname); END IF;
  END LOOP;
  DELETE FROM public.security_events_default WHERE created_at < cutoff_se;

  -- login_attempts (>90d)
  FOR r IN SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
           FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='public.login_attempts'::regclass AND c.relname <> 'login_attempts_default' LOOP
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff_la THEN EXECUTE format('DROP TABLE public.%I', r.relname); END IF;
  END LOOP;
  DELETE FROM public.login_attempts_default WHERE created_at < cutoff_la;
END$$;

REVOKE EXECUTE ON FUNCTION public.run_retention_cleanup() FROM PUBLIC, anon, authenticated;
