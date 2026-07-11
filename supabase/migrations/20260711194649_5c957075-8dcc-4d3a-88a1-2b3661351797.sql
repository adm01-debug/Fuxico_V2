
-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Retention/cleanup function
CREATE OR REPLACE FUNCTION public.run_retention_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts        WHERE created_at < now() - interval '90 days';
  DELETE FROM public.password_reset_tokens WHERE (used_at IS NOT NULL OR expires_at < now()) AND created_at < now() - interval '30 days';
  DELETE FROM public.email_verification_tokens WHERE (verified_at IS NOT NULL OR expires_at < now()) AND created_at < now() - interval '30 days';
  DELETE FROM public.webauthn_challenges   WHERE expires_at < now() - interval '1 day';
  DELETE FROM public.blocked_ips           WHERE expires_at IS NOT NULL AND expires_at < now() - interval '7 days';
  DELETE FROM public.webhook_logs          WHERE created_at < now() - interval '90 days';
  DELETE FROM public.rate_limit_logs       WHERE created_at < now() - interval '30 days';
  DELETE FROM public.login_lockouts        WHERE (lockout_until IS NULL OR lockout_until < now() - interval '7 days') AND updated_at < now() - interval '7 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.run_tracking_events_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tracking_events WHERE created_at < now() - interval '180 days';
END;
$$;

-- Unschedule any prior jobs with same name (idempotent)
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobname FROM cron.job WHERE jobname IN
    ('retention_cleanup_daily','refresh_email_stats_mv_5min','tracking_events_retention_weekly')
  LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END$$;

SELECT cron.schedule(
  'retention_cleanup_daily',
  '0 3 * * *',
  $$SELECT public.run_retention_cleanup();$$
);

SELECT cron.schedule(
  'refresh_email_stats_mv_5min',
  '*/5 * * * *',
  $$SELECT public.refresh_email_stats_mv();$$
);

SELECT cron.schedule(
  'tracking_events_retention_weekly',
  '0 4 * * 0',
  $$SELECT public.run_tracking_events_retention();$$
);
