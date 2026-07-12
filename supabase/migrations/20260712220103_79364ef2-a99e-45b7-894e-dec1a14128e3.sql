-- Onda 30: admin_ops_dashboard com CTE única (F-08)
CREATE OR REPLACE FUNCTION public.admin_ops_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH last_runs AS (
    SELECT DISTINCT ON (jobid)
      jobid, status, start_time, end_time, return_message
    FROM cron.job_run_details
    ORDER BY jobid, start_time DESC
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'database', jsonb_build_object(
      'total_size', pg_size_pretty(pg_database_size(current_database())),
      'total_bytes', pg_database_size(current_database())
    ),
    'connections', (
      SELECT jsonb_build_object(
        'active', COUNT(*) FILTER (WHERE state = 'active'),
        'idle', COUNT(*) FILTER (WHERE state = 'idle'),
        'idle_in_tx', COUNT(*) FILTER (WHERE state = 'idle in transaction'),
        'total', COUNT(*)
      )
      FROM pg_stat_activity
      WHERE datname = current_database()
    ),
    'top_tables', (
      SELECT jsonb_agg(t) FROM (
        SELECT
          c.relname AS table_name,
          pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
          pg_total_relation_size(c.oid) AS total_bytes,
          COALESCE(s.n_live_tup, 0) AS live_rows
        FROM pg_class c
        LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
        WHERE c.relnamespace = 'public'::regnamespace
          AND c.relkind IN ('r','p')
        ORDER BY pg_total_relation_size(c.oid) DESC
        LIMIT 10
      ) t
    ),
    'cron_jobs', (
      SELECT jsonb_agg(j) FROM (
        SELECT
          job.jobname,
          job.schedule,
          job.active,
          CASE WHEN lr.jobid IS NULL THEN NULL
               ELSE jsonb_build_object(
                 'status', lr.status,
                 'start_time', lr.start_time,
                 'end_time', lr.end_time,
                 'return_message', LEFT(COALESCE(lr.return_message, ''), 200)
               )
          END AS last_run
        FROM cron.job job
        LEFT JOIN last_runs lr ON lr.jobid = job.jobid
        WHERE job.jobname LIKE 'fuxico-%'
        ORDER BY job.jobname
      ) j
    ),
    'mv_freshness', jsonb_build_object(
      'email_stats_mv_last_refresh', GREATEST(
        COALESCE(pg_stat_get_last_analyze_time('public.email_stats_mv'::regclass), '1970-01-01'::timestamptz),
        COALESCE(pg_stat_get_last_autoanalyze_time('public.email_stats_mv'::regclass), '1970-01-01'::timestamptz)
      )
    ),
    'default_partition_stragglers', jsonb_build_object(
      'tracking_events_default',   (SELECT COUNT(*) FROM public.tracking_events_default),
      'audit_logs_default',        (SELECT COUNT(*) FROM public.audit_logs_default),
      'webhook_logs_default',      (SELECT COUNT(*) FROM public.webhook_logs_default),
      'login_attempts_default',    (SELECT COUNT(*) FROM public.login_attempts_default),
      'rate_limit_logs_default',   (SELECT COUNT(*) FROM public.rate_limit_logs_default),
      'security_events_default',   (SELECT COUNT(*) FROM public.security_events_default)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_ops_dashboard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ops_dashboard() TO service_role;