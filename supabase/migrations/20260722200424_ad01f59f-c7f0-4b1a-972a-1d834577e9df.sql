
CREATE OR REPLACE FUNCTION public.admin_system_health_score()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cron_fail_24h INT := 0;
  cron_fail_7d INT := 0;
  critical_events_24h INT := 0;
  bloat_alerts_24h INT := 0;
  regressions_24h INT := 0;
  advisor_high INT := 0;
  circuits_open INT := 0;
  dsar_sla_miss INT := 0;
  drift_removed INT := 0;
  score NUMERIC := 10.0;
  grade TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT COUNT(*) INTO cron_fail_24h FROM public.cron_job_failures
    WHERE status = 'failure' AND created_at > now() - interval '24 hours';
  SELECT COUNT(*) INTO cron_fail_7d FROM public.cron_job_failures
    WHERE status = 'failure' AND created_at > now() - interval '7 days';
  SELECT COUNT(*) INTO critical_events_24h FROM public.security_events
    WHERE severity = 'critical' AND created_at > now() - interval '24 hours';

  BEGIN
    SELECT COUNT(*) INTO circuits_open FROM public.webhook_circuit_state WHERE state = 'open';
  EXCEPTION WHEN OTHERS THEN circuits_open := 0; END;

  BEGIN
    SELECT public.count_dsar_sla_misses() INTO dsar_sla_miss;
  EXCEPTION WHEN OTHERS THEN dsar_sla_miss := 0; END;

  -- Penalidades
  score := score - LEAST(2.0, cron_fail_24h * 0.2);
  score := score - LEAST(1.5, cron_fail_7d * 0.05);
  score := score - LEAST(2.5, critical_events_24h * 0.3);
  score := score - LEAST(1.0, circuits_open * 0.25);
  score := score - LEAST(2.0, dsar_sla_miss * 0.5);
  score := GREATEST(0, score);

  grade := CASE
    WHEN score >= 9.5 THEN 'A+'
    WHEN score >= 9.0 THEN 'A'
    WHEN score >= 8.0 THEN 'B'
    WHEN score >= 6.5 THEN 'C'
    WHEN score >= 5.0 THEN 'D'
    ELSE 'F'
  END;

  RETURN jsonb_build_object(
    'score', ROUND(score::numeric, 2),
    'grade', grade,
    'computed_at', now(),
    'breakdown', jsonb_build_object(
      'cron_failures_24h', cron_fail_24h,
      'cron_failures_7d', cron_fail_7d,
      'critical_events_24h', critical_events_24h,
      'circuits_open', circuits_open,
      'dsar_sla_misses', dsar_sla_miss,
      'bloat_alerts_24h', bloat_alerts_24h,
      'query_regressions_24h', regressions_24h,
      'advisor_high_last_run', advisor_high
    )
  );
END;
$$;
