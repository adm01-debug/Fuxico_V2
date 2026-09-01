-- Enable pg_cron for scheduled maintenance
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function that provisions the next 3 months of partitions for all partitioned tables
CREATE OR REPLACE FUNCTION public.ensure_future_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m date;
BEGIN
  FOR i IN 0..3 LOOP
    m := (date_trunc('month', now()) + (i || ' months')::interval)::date;
    PERFORM public.ensure_tracking_events_partition(m);
    PERFORM public.ensure_webhook_logs_partition(m);
    PERFORM public.ensure_audit_logs_partition(m);
    PERFORM public.ensure_login_attempts_partition(m);
    PERFORM public.ensure_rate_limit_logs_partition(m);
    PERFORM public.ensure_security_events_partition(m);
  END LOOP;
END;
$$;

-- Refresh helper for the email stats materialized view (CONCURRENTLY when possible)
CREATE OR REPLACE FUNCTION public.refresh_email_stats_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.email_stats_mv;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW public.email_stats_mv;
  END;
END;
$$;

-- Unschedule any previous versions (idempotent)
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobname FROM cron.job WHERE jobname IN (
    'fuxico-ensure-future-partitions',
    'fuxico-retention-cleanup',
    'fuxico-tracking-events-retention',
    'fuxico-refresh-email-stats-mv',
    'fuxico-cleanup-webauthn-challenges'
  ) LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END $$;

-- Schedule jobs
SELECT cron.schedule('fuxico-ensure-future-partitions', '0 2 * * *', $$SELECT public.ensure_future_partitions();$$);
SELECT cron.schedule('fuxico-retention-cleanup',        '0 3 * * *', $$SELECT public.run_retention_cleanup();$$);
SELECT cron.schedule('fuxico-tracking-events-retention','30 3 * * *', $$SELECT public.run_tracking_events_retention();$$);
SELECT cron.schedule('fuxico-refresh-email-stats-mv',   '*/5 * * * *', $$SELECT public.refresh_email_stats_mv();$$);
SELECT cron.schedule('fuxico-cleanup-webauthn-challenges', '0 * * * *', $$SELECT public.cleanup_expired_challenges();$$);

-- Provision partitions right now so the very next insert has a home
SELECT public.ensure_future_partitions();