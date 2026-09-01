
CREATE OR REPLACE FUNCTION public.admin_webhook_failure_rates()
RETURNS TABLE (
  webhook_id uuid,
  webhook_url text,
  is_active boolean,
  total_24h bigint,
  success_24h bigint,
  failure_24h bigint,
  failure_rate_24h numeric,
  total_7d bigint,
  success_7d bigint,
  failure_7d bigint,
  failure_rate_7d numeric,
  last_failure_at timestamptz,
  last_success_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH auth_check AS (
    SELECT CASE WHEN public.has_role(auth.uid(), 'admin'::app_role)
      THEN true ELSE (SELECT 1/0)::boolean END AS ok
  ),
  agg AS (
    SELECT
      wl.webhook_id,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '24 hours') AS total_24h,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '24 hours' AND wl.success) AS success_24h,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '24 hours' AND NOT wl.success) AS failure_24h,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '7 days') AS total_7d,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '7 days' AND wl.success) AS success_7d,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '7 days' AND NOT wl.success) AS failure_7d,
      max(wl.created_at) FILTER (WHERE NOT wl.success) AS last_failure_at,
      max(wl.created_at) FILTER (WHERE wl.success) AS last_success_at
    FROM public.webhook_logs wl
    WHERE wl.created_at >= now() - interval '7 days'
      AND (SELECT ok FROM auth_check)
      AND wl.webhook_id IS NOT NULL
    GROUP BY wl.webhook_id
  )
  SELECT
    a.webhook_id,
    wc.url AS webhook_url,
    wc.is_active,
    a.total_24h,
    a.success_24h,
    a.failure_24h,
    CASE WHEN a.total_24h > 0 THEN round((a.failure_24h::numeric / a.total_24h) * 100, 2) ELSE 0 END AS failure_rate_24h,
    a.total_7d,
    a.success_7d,
    a.failure_7d,
    CASE WHEN a.total_7d > 0 THEN round((a.failure_7d::numeric / a.total_7d) * 100, 2) ELSE 0 END AS failure_rate_7d,
    a.last_failure_at,
    a.last_success_at
  FROM agg a
  LEFT JOIN public.webhook_configs wc ON wc.id = a.webhook_id
  ORDER BY a.failure_24h DESC, a.failure_7d DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_webhook_failure_rates() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_webhook_failure_rates() FROM anon;
REVOKE ALL ON FUNCTION public.admin_webhook_failure_rates() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_webhook_failure_rates() TO service_role;

CREATE OR REPLACE FUNCTION public.admin_webhook_retry_history(_limit int DEFAULT 200)
RETURNS TABLE (
  id uuid,
  webhook_id uuid,
  webhook_url text,
  event_type text,
  attempts int,
  max_attempts int,
  status text,
  last_error text,
  next_attempt_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH auth_check AS (
    SELECT CASE WHEN public.has_role(auth.uid(), 'admin'::app_role)
      THEN true ELSE (SELECT 1/0)::boolean END AS ok
  )
  SELECT
    q.id,
    q.webhook_id,
    wc.url AS webhook_url,
    q.event_type,
    q.attempts,
    q.max_attempts,
    q.status,
    q.last_error,
    q.next_attempt_at,
    q.created_at,
    q.updated_at
  FROM public.webhook_retry_queue q
  LEFT JOIN public.webhook_configs wc ON wc.id = q.webhook_id
  WHERE (SELECT ok FROM auth_check)
  ORDER BY q.updated_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 1000);
$$;

REVOKE ALL ON FUNCTION public.admin_webhook_retry_history(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_webhook_retry_history(int) FROM anon;
REVOKE ALL ON FUNCTION public.admin_webhook_retry_history(int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_webhook_retry_history(int) TO service_role;
