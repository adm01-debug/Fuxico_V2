CREATE OR REPLACE FUNCTION public.monitor_archive_and_webhook_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archive_last_hour  int := 0;
  v_archive_baseline   numeric := 0;
  v_archive_alerted    boolean := false;
  v_webhook_alerts     int := 0;
  v_wh record;
  v_reason text;
  v_threshold_count int := 3;
  v_ratio_factor numeric := 3;
BEGIN
  SELECT count(*) INTO v_archive_last_hour
  FROM public.security_events
  WHERE event_type = 'partition_archive_verification_failure'
    AND created_at >= now() - interval '1 hour';

  SELECT COALESCE(count(*)::numeric / 5.0, 0) INTO v_archive_baseline
  FROM public.security_events
  WHERE event_type = 'partition_archive_verification_failure'
    AND created_at <  now() - interval '1 hour'
    AND created_at >= now() - interval '6 hours';

  IF v_archive_last_hour >= v_threshold_count
     AND (v_archive_baseline < 1 OR v_archive_last_hour::numeric >= v_archive_baseline * v_ratio_factor)
  THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.security_events
      WHERE event_type = 'archive_verification_spike'
        AND created_at >= now() - interval '1 hour'
    ) THEN
      v_reason := format(
        'Pico de falhas de verificacao de particao: %s na ultima hora vs. baseline %.2f/h (janela 1-6h).',
        v_archive_last_hour, v_archive_baseline
      );
      INSERT INTO public.security_events (event_type, severity, description, metadata)
      VALUES (
        'archive_verification_spike',
        'critical',
        v_reason,
        jsonb_build_object(
          'last_hour_count', v_archive_last_hour,
          'baseline_per_hour', v_archive_baseline,
          'threshold_count', v_threshold_count,
          'ratio_factor', v_ratio_factor,
          'detected_at', now()
        )
      );
      v_archive_alerted := true;
    END IF;
  END IF;

  FOR v_wh IN
    WITH agg AS (
      SELECT
        webhook_id,
        count(*) FILTER (WHERE status IN ('failed','pending') AND attempts >= 3
                          AND updated_at >= now() - interval '2 hours') AS heavy_retries,
        count(*) FILTER (WHERE status = 'dead_letter'
                          AND updated_at >= now() - interval '1 hour') AS dead_letters,
        max(attempts) AS max_attempts,
        max(last_error) AS sample_error
      FROM public.webhook_retry_queue
      WHERE webhook_id IS NOT NULL
      GROUP BY webhook_id
    )
    SELECT * FROM agg
    WHERE heavy_retries >= 5 OR dead_letters >= 1
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.security_events
      WHERE event_type = 'webhook_replay_recurring_failure'
        AND (metadata->>'webhook_id')::uuid = v_wh.webhook_id
        AND created_at >= now() - interval '6 hours'
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.security_events (event_type, severity, description, metadata)
    VALUES (
      'webhook_replay_recurring_failure',
      CASE WHEN v_wh.dead_letters >= 1 THEN 'critical' ELSE 'high' END,
      format(
        'Falhas recorrentes no replay do webhook %s (heavy_retries=%s, dead_letters=%s, max_attempts=%s).',
        v_wh.webhook_id, v_wh.heavy_retries, v_wh.dead_letters, v_wh.max_attempts
      ),
      jsonb_build_object(
        'webhook_id', v_wh.webhook_id,
        'heavy_retries', v_wh.heavy_retries,
        'dead_letters', v_wh.dead_letters,
        'max_attempts', v_wh.max_attempts,
        'sample_error', left(coalesce(v_wh.sample_error, ''), 500),
        'detected_at', now()
      )
    );
    v_webhook_alerts := v_webhook_alerts + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ran_at', now(),
    'archive', jsonb_build_object(
      'last_hour_count', v_archive_last_hour,
      'baseline_per_hour', v_archive_baseline,
      'spike_alert_emitted', v_archive_alerted
    ),
    'webhook_alerts_emitted', v_webhook_alerts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.monitor_archive_and_webhook_health()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monitor_archive_and_webhook_health()
  TO service_role;

COMMENT ON FUNCTION public.monitor_archive_and_webhook_health() IS
  'Onda 123: detecta picos de partition_archive_verification_failure e falhas recorrentes em webhook_retry_queue, emitindo security_events consumidos pelo dispatch_critical_alerts.';