
-- ONDA 20 — Cron job health monitor + status view

CREATE OR REPLACE FUNCTION public.monitor_cron_jobs()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_row record;
  v_count integer := 0;
  v_last_run timestamptz;
  v_last_status text;
  v_last_message text;
BEGIN
  FOR v_row IN
    SELECT jobid, jobname, schedule, active
    FROM cron.job
    WHERE jobname LIKE 'fuxico-%'
  LOOP
    SELECT start_time, status, LEFT(COALESCE(return_message, ''), 500)
      INTO v_last_run, v_last_status, v_last_message
    FROM cron.job_run_details
    WHERE jobid = v_row.jobid
    ORDER BY start_time DESC
    LIMIT 1;

    -- Job falhou na última execução
    IF v_last_status = 'failed' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.security_events
        WHERE event_type = 'cron_job_failed'
          AND metadata->>'jobname' = v_row.jobname
          AND created_at > now() - interval '6 hours'
      ) THEN
        PERFORM public.log_security_event(
          NULL, 'cron_job_failed', 'high',
          format('Cron job %s failed: %s', v_row.jobname, v_last_message),
          NULL, NULL,
          jsonb_build_object(
            'jobname', v_row.jobname,
            'schedule', v_row.schedule,
            'last_run', v_last_run,
            'return_message', v_last_message
          )
        );
        v_count := v_count + 1;
      END IF;
    END IF;

    -- Job stale: cron horário sem execução há > 90min; diário há > 26h
    IF v_last_run IS NOT NULL AND (
        (v_row.schedule LIKE '%* * * *%' AND v_last_run < now() - interval '90 minutes')
     OR (v_row.schedule LIKE '% * * *' AND v_row.schedule NOT LIKE '%* * * *%' AND v_last_run < now() - interval '26 hours')
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.security_events
        WHERE event_type = 'cron_job_stale'
          AND metadata->>'jobname' = v_row.jobname
          AND created_at > now() - interval '6 hours'
      ) THEN
        PERFORM public.log_security_event(
          NULL, 'cron_job_stale', 'medium',
          format('Cron job %s has not run since %s', v_row.jobname, v_last_run),
          NULL, NULL,
          jsonb_build_object(
            'jobname', v_row.jobname,
            'schedule', v_row.schedule,
            'last_run', v_last_run
          )
        );
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN v_count;
END; $$;

REVOKE ALL ON FUNCTION public.monitor_cron_jobs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monitor_cron_jobs() TO service_role;

-- View admin consolidada de status
CREATE OR REPLACE VIEW public.admin_cron_status
WITH (security_invoker = true) AS
SELECT
  j.jobname,
  j.schedule,
  j.active,
  d.status AS last_status,
  d.start_time AS last_start,
  d.end_time AS last_end,
  ROUND(EXTRACT(EPOCH FROM (d.end_time - d.start_time))::numeric, 2) AS last_duration_sec,
  LEFT(COALESCE(d.return_message, ''), 200) AS last_message,
  (SELECT COUNT(*) FROM cron.job_run_details WHERE jobid = j.jobid AND status = 'failed' AND start_time > now() - interval '24 hours') AS failures_24h
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT status, start_time, end_time, return_message
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC
  LIMIT 1
) d ON true
WHERE j.jobname LIKE 'fuxico-%'
  AND public.has_role(auth.uid(), 'admin'::app_role);

REVOKE ALL ON public.admin_cron_status FROM PUBLIC, anon;
GRANT SELECT ON public.admin_cron_status TO authenticated;
