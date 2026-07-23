
-- 1) Pool stats
CREATE OR REPLACE FUNCTION public.admin_pool_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max int;
  v_total int;
  v_active int;
  v_idle int;
  v_waiting int;
  v_util numeric;
BEGIN
  SELECT setting::int INTO v_max FROM pg_settings WHERE name='max_connections';
  SELECT count(*)::int,
         count(*) FILTER (WHERE state='active')::int,
         count(*) FILTER (WHERE state='idle')::int,
         count(*) FILTER (WHERE wait_event_type='Lock' OR wait_event_type='LWLock')::int
    INTO v_total, v_active, v_idle, v_waiting
  FROM pg_stat_activity
  WHERE pid <> pg_backend_pid();

  v_util := CASE WHEN v_max > 0 THEN round((v_total::numeric / v_max) * 100, 2) ELSE 0 END;

  RETURN jsonb_build_object(
    'max_connections', v_max,
    'total', v_total,
    'active', v_active,
    'idle', v_idle,
    'waiting', v_waiting,
    'utilization_pct', v_util
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_pool_stats() FROM PUBLIC, anon, authenticated;

-- 2) Signing key age (uses auth.audit_log_entries as proxy for last key rotation)
CREATE OR REPLACE FUNCTION public.admin_signing_key_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_last_rotation timestamptz;
  v_age_days int;
BEGIN
  BEGIN
    SELECT max(created_at) INTO v_last_rotation
    FROM auth.audit_log_entries
    WHERE payload::text ILIKE '%signing_key%';
  EXCEPTION WHEN OTHERS THEN
    v_last_rotation := NULL;
  END;

  v_age_days := CASE
    WHEN v_last_rotation IS NULL THEN NULL
    ELSE extract(day from (now() - v_last_rotation))::int
  END;

  RETURN jsonb_build_object(
    'last_rotation', v_last_rotation,
    'age_days', v_age_days,
    'needs_rotation', coalesce(v_age_days > 85, false)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_signing_key_status() FROM PUBLIC, anon, authenticated;

-- 3) Health Score v3
CREATE OR REPLACE FUNCTION public.admin_system_health_score()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score numeric := 10.0;
  v_breakdown jsonb := '{}'::jsonb;
  v_val int;
  v_pool jsonb;
  v_key jsonb;
  v_grade text;
BEGIN
  -- Cron failures 24h
  SELECT count(*)::int INTO v_val
  FROM public.cron_job_failures
  WHERE failed_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('cron_failures_24h', v_val);
  v_score := v_score - least(v_val * 0.5, 2);

  -- Cron failures 7d
  SELECT count(*)::int INTO v_val
  FROM public.cron_job_failures
  WHERE failed_at >= now() - interval '7 days';
  v_breakdown := v_breakdown || jsonb_build_object('cron_failures_7d', v_val);
  v_score := v_score - least(v_val * 0.1, 1);

  -- Critical events 24h
  SELECT count(*)::int INTO v_val
  FROM public.security_events
  WHERE severity IN ('critical','high') AND created_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('critical_events_24h', v_val);
  v_score := v_score - least(v_val * 0.3, 2);

  -- Circuits open
  SELECT count(*)::int INTO v_val
  FROM public.webhook_circuit_state
  WHERE state = 'open';
  v_breakdown := v_breakdown || jsonb_build_object('circuits_open', v_val);
  v_score := v_score - least(v_val * 0.4, 1.5);

  -- DSAR SLA misses
  SELECT count(*)::int INTO v_val
  FROM public.dsar_requests
  WHERE status IN ('processing','pending')
    AND created_at < now() - interval '15 days';
  v_breakdown := v_breakdown || jsonb_build_object('dsar_sla_misses', v_val);
  v_score := v_score - least(v_val * 0.5, 1);

  -- Retry queue depth
  SELECT count(*)::int INTO v_val
  FROM public.webhook_retry_queue
  WHERE status = 'pending';
  v_breakdown := v_breakdown || jsonb_build_object('retry_queue_depth', v_val);
  v_score := v_score - least(v_val * 0.02, 1);

  -- RLS canary failures (last 24h)
  SELECT count(*)::int INTO v_val
  FROM public.security_events
  WHERE event_type = 'rls_canary_failure'
    AND created_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('rls_canary_failures_24h', v_val);
  v_score := v_score - v_val * 3; -- Severe penalty

  -- Pool utilization
  v_pool := public.admin_pool_stats();
  v_breakdown := v_breakdown || jsonb_build_object(
    'pool_utilization_pct', (v_pool->>'utilization_pct')::numeric
  );
  IF (v_pool->>'utilization_pct')::numeric > 80 THEN
    v_score := v_score - 1;
  ELSIF (v_pool->>'utilization_pct')::numeric > 60 THEN
    v_score := v_score - 0.3;
  END IF;

  -- Signing key age
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
$$;

REVOKE EXECUTE ON FUNCTION public.admin_system_health_score() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_system_health_score() TO authenticated;
