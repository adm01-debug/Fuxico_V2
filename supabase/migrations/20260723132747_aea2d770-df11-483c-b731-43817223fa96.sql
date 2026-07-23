
CREATE OR REPLACE FUNCTION public.admin_system_health_score()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_score numeric := 10.0;
  v_breakdown jsonb := '{}'::jsonb;
  v_val int;
  v_pool jsonb;
  v_key jsonb;
  v_grade text;
BEGIN
  SELECT count(*)::int INTO v_val
  FROM public.cron_job_failures
  WHERE created_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('cron_failures_24h', v_val);
  v_score := v_score - least(v_val * 0.5, 2);

  SELECT count(*)::int INTO v_val
  FROM public.cron_job_failures
  WHERE created_at >= now() - interval '7 days';
  v_breakdown := v_breakdown || jsonb_build_object('cron_failures_7d', v_val);
  v_score := v_score - least(v_val * 0.1, 1);

  SELECT count(*)::int INTO v_val
  FROM public.security_events
  WHERE severity IN ('critical','high') AND created_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('critical_events_24h', v_val);
  v_score := v_score - least(v_val * 0.3, 2);

  SELECT count(*)::int INTO v_val
  FROM public.webhook_circuit_state
  WHERE state = 'open';
  v_breakdown := v_breakdown || jsonb_build_object('circuits_open', v_val);
  v_score := v_score - least(v_val * 0.4, 1.5);

  SELECT count(*)::int INTO v_val
  FROM public.dsar_requests
  WHERE status IN ('processing','pending')
    AND created_at < now() - interval '15 days';
  v_breakdown := v_breakdown || jsonb_build_object('dsar_sla_misses', v_val);
  v_score := v_score - least(v_val * 0.5, 1);

  SELECT count(*)::int INTO v_val
  FROM public.webhook_retry_queue
  WHERE status = 'pending';
  v_breakdown := v_breakdown || jsonb_build_object('retry_queue_depth', v_val);
  v_score := v_score - least(v_val * 0.02, 1);

  SELECT count(*)::int INTO v_val
  FROM public.security_events
  WHERE event_type = 'rls_canary_failure'
    AND created_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('rls_canary_failures_24h', v_val);
  v_score := v_score - v_val * 3;

  v_pool := public.admin_pool_stats();
  v_breakdown := v_breakdown || jsonb_build_object(
    'pool_utilization_pct', (v_pool->>'utilization_pct')::numeric
  );
  IF (v_pool->>'utilization_pct')::numeric > 80 THEN
    v_score := v_score - 1;
  ELSIF (v_pool->>'utilization_pct')::numeric > 60 THEN
    v_score := v_score - 0.3;
  END IF;

  v_key := public.admin_signing_key_status();
  v_breakdown := v_breakdown || jsonb_build_object(
    'signing_key_age_days', v_key->>'age_days'
  );
  IF (v_key->>'needs_rotation')::boolean THEN
    v_score := v_score - 0.5;
  END IF;

  v_score := greatest(0, round(v_score::numeric, 2));

  v_grade := CASE
    WHEN v_score >= 9.5 THEN 'A+'
    WHEN v_score >= 9   THEN 'A'
    WHEN v_score >= 8   THEN 'B'
    WHEN v_score >= 7   THEN 'C'
    WHEN v_score >= 6   THEN 'D'
    ELSE 'F'
  END;

  RETURN jsonb_build_object(
    'score', v_score,
    'grade', v_grade,
    'breakdown', v_breakdown,
    'computed_at', now()
  );
END;
$function$;
