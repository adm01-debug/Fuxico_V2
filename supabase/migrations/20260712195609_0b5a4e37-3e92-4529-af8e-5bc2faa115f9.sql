-- Consolidated operational dashboard for admins
CREATE OR REPLACE FUNCTION public.admin_ops_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

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
          jobname,
          schedule,
          active,
          (SELECT jsonb_build_object(
             'status', status,
             'start_time', start_time,
             'end_time', end_time,
             'return_message', LEFT(COALESCE(return_message, ''), 200)
           )
           FROM cron.job_run_details
           WHERE jobid = job.jobid
           ORDER BY start_time DESC
           LIMIT 1) AS last_run
        FROM cron.job job
        WHERE jobname LIKE 'fuxico-%'
        ORDER BY jobname
      ) j
    ),
    'mv_freshness', (
      SELECT jsonb_build_object(
        'email_stats_mv_last_refresh', (
          SELECT GREATEST(
            COALESCE(pg_stat_get_last_analyze_time('public.email_stats_mv'::regclass), '1970-01-01'::timestamptz),
            COALESCE(pg_stat_get_last_autoanalyze_time('public.email_stats_mv'::regclass), '1970-01-01'::timestamptz)
          )
        )
      )
    ),
    'default_partition_stragglers', (
      SELECT jsonb_build_object(
        'tracking_events_default', (SELECT COUNT(*) FROM public.tracking_events_default),
        'audit_logs_default', (SELECT COUNT(*) FROM public.audit_logs_default),
        'webhook_logs_default', (SELECT COUNT(*) FROM public.webhook_logs_default),
        'login_attempts_default', (SELECT COUNT(*) FROM public.login_attempts_default),
        'rate_limit_logs_default', (SELECT COUNT(*) FROM public.rate_limit_logs_default),
        'security_events_default', (SELECT COUNT(*) FROM public.security_events_default)
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_ops_dashboard() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ops_dashboard() TO authenticated;

-- Partition coverage view (how many future partitions each partitioned table has)
CREATE OR REPLACE VIEW public.admin_partition_coverage
WITH (security_invoker = true)
AS
SELECT
  parent.relname AS parent_table,
  COUNT(*) FILTER (WHERE child.relname NOT LIKE '%_default') AS partitions,
  COUNT(*) FILTER (
    WHERE child.relname NOT LIKE '%_default'
    AND (substring(pg_get_expr(child.relpartbound, child.oid) FROM 'TO \(''([^'']+)''\)'))::timestamptz > now()
  ) AS future_partitions,
  MAX(
    CASE WHEN child.relname NOT LIKE '%_default'
      THEN (substring(pg_get_expr(child.relpartbound, child.oid) FROM 'TO \(''([^'']+)''\)'))::timestamptz
    END
  ) AS coverage_until
FROM pg_inherits i
JOIN pg_class parent ON parent.oid = i.inhparent
JOIN pg_class child ON child.oid = i.inhrelid
WHERE parent.relnamespace = 'public'::regnamespace
  AND parent.relkind = 'p'
  AND public.has_role(auth.uid(), 'admin'::app_role)
GROUP BY parent.relname
ORDER BY parent.relname;

REVOKE ALL ON public.admin_partition_coverage FROM anon, authenticated;
GRANT SELECT ON public.admin_partition_coverage TO authenticated;