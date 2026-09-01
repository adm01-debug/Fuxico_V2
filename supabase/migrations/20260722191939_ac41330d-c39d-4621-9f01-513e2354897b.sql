CREATE OR REPLACE FUNCTION public.admin_system_health_score()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cron_failures int;
  v_critical_events int;
  v_bloat int;
  v_slow_queries int;
  v_advisor_high int;
  v_score numeric := 10.0;
  v_breakdown jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_cron_failures
    FROM public.cron_job_failures
   WHERE created_at > now() - interval '24 hours'
     AND resolved_at IS NULL;

  SELECT count(*) INTO v_critical_events
    FROM public.security_events
   WHERE severity IN ('critical','high')
     AND created_at > now() - interval '24 hours';

  SELECT count(*) INTO v_bloat
    FROM public.security_events
   WHERE event_type = 'table_bloat_high'
     AND created_at > now() - interval '24 hours';

  SELECT count(*) INTO v_slow_queries
    FROM public.security_events
   WHERE event_type = 'query_regression'
     AND created_at > now() - interval '24 hours';

  SELECT COALESCE(high_count, 0) INTO v_advisor_high
    FROM public.index_advisor_runs
   ORDER BY ran_at DESC LIMIT 1;

  -- Penalidades ponderadas (max: 10)
  v_score := v_score
    - LEAST(v_cron_failures * 0.5, 3.0)
    - LEAST(v_critical_events * 0.3, 2.5)
    - LEAST(v_bloat * 0.4, 1.5)
    - LEAST(v_slow_queries * 0.4, 1.5)
    - LEAST(v_advisor_high * 0.3, 1.5);
  v_score := GREATEST(v_score, 0);

  v_breakdown := jsonb_build_object(
    'cron_failures_24h', v_cron_failures,
    'critical_events_24h', v_critical_events,
    'bloat_alerts_24h', v_bloat,
    'query_regressions_24h', v_slow_queries,
    'advisor_high_last_run', COALESCE(v_advisor_high, 0)
  );

  RETURN jsonb_build_object(
    'score', ROUND(v_score, 2),
    'grade', CASE
      WHEN v_score >= 9.5 THEN 'A+'
      WHEN v_score >= 9.0 THEN 'A'
      WHEN v_score >= 8.0 THEN 'B'
      WHEN v_score >= 6.5 THEN 'C'
      WHEN v_score >= 5.0 THEN 'D'
      ELSE 'F' END,
    'breakdown', v_breakdown,
    'computed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_system_health_score() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_system_health_score() TO authenticated, service_role;