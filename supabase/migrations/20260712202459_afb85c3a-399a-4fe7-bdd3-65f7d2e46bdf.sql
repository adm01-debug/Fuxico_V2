
-- ONDA 16 — Autovacuum tuning + advisory locks + health check

-- Autovacuum agressivo em tabelas write-heavy
ALTER TABLE public.tracked_emails SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_cost_limit=2000, fillfactor=90);
ALTER TABLE public.sequence_enrollments SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_cost_limit=2000, fillfactor=90);
ALTER TABLE public.scheduled_emails SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, fillfactor=85);
ALTER TABLE public.contact_scores SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, fillfactor=85);
ALTER TABLE public.domain_reputation SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, fillfactor=85);
ALTER TABLE public.notification_history SET (autovacuum_vacuum_scale_factor=0.08, autovacuum_analyze_scale_factor=0.04, fillfactor=90);
ALTER TABLE public.follow_up_reminders SET (autovacuum_vacuum_scale_factor=0.08, autovacuum_analyze_scale_factor=0.04, fillfactor=90);

-- Advisory locks para jobs singleton
CREATE OR REPLACE FUNCTION public.try_singleton_job(_job_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN pg_try_advisory_lock(hashtextextended(_job_key, 0));
END; $$;

CREATE OR REPLACE FUNCTION public.release_singleton_job(_job_key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM pg_advisory_unlock(hashtextextended(_job_key, 0));
END; $$;

REVOKE ALL ON FUNCTION public.try_singleton_job(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_singleton_job(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_singleton_job(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_singleton_job(text) TO service_role;

-- Health check consolidado
CREATE OR REPLACE FUNCTION public.db_health_check()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_mv_age interval; v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT now() - GREATEST(
    COALESCE(pg_stat_get_last_analyze_time('public.email_stats_mv'::regclass), '1970-01-01'::timestamptz),
    COALESCE(pg_stat_get_last_autoanalyze_time('public.email_stats_mv'::regclass), '1970-01-01'::timestamptz)
  ) INTO v_mv_age;
  SELECT jsonb_build_object(
    'status', CASE WHEN v_mv_age > interval '30 minutes' THEN 'degraded' ELSE 'healthy' END,
    'checked_at', now(),
    'checks', jsonb_build_object(
      'connections_ok', (SELECT COUNT(*) < 400 FROM pg_stat_activity WHERE datname = current_database()),
      'mv_freshness_ok', v_mv_age < interval '30 minutes',
      'mv_age_seconds', EXTRACT(EPOCH FROM v_mv_age),
      'default_partitions_empty',
        (SELECT COUNT(*) FROM public.tracking_events_default) = 0
        AND (SELECT COUNT(*) FROM public.audit_logs_default) = 0,
      'blocked_locks', (SELECT COUNT(*) FROM pg_locks WHERE NOT granted)
    )
  ) INTO v_result;
  RETURN v_result;
END; $$;

REVOKE ALL ON FUNCTION public.db_health_check() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.db_health_check() TO authenticated;

ANALYZE public.tracked_emails;
ANALYZE public.sequence_enrollments;
ANALYZE public.scheduled_emails;
ANALYZE public.contact_scores;
ANALYZE public.domain_reputation;
ANALYZE public.notification_history;
ANALYZE public.follow_up_reminders;
