
CREATE OR REPLACE FUNCTION public.admin_list_critical_alerts(
  _hours integer DEFAULT 72,
  _event_types text[] DEFAULT NULL,
  _severities text[] DEFAULT ARRAY['critical','high','error','warning'],
  _dispatch_status text DEFAULT NULL, -- 'sent' | 'failed' | 'skipped' | 'pending'
  _limit integer DEFAULT 200,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  event_type text,
  severity text,
  description text,
  metadata jsonb,
  created_at timestamptz,
  dispatch_status text,
  dispatched_at timestamptz,
  admin_count integer,
  channels text[],
  error_message text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since timestamptz := now() - make_interval(hours => GREATEST(_hours, 1));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT se.id, se.event_type, se.severity, se.description, se.metadata, se.created_at
    FROM public.security_events se
    WHERE se.created_at >= _since
      AND se.severity = ANY(_severities)
      AND (_event_types IS NULL OR se.event_type = ANY(_event_types))
  ),
  joined AS (
    SELECT b.*,
           COALESCE(adl.status, 'pending') AS dispatch_status,
           adl.dispatched_at,
           COALESCE(adl.admin_count, 0) AS admin_count,
           COALESCE(adl.channels, ARRAY[]::text[]) AS channels,
           adl.error_message
    FROM base b
    LEFT JOIN LATERAL (
      SELECT status, dispatched_at, admin_count, channels, error_message
      FROM public.alert_dispatch_log
      WHERE security_event_id = b.id
      ORDER BY dispatched_at DESC
      LIMIT 1
    ) adl ON TRUE
  ),
  filtered AS (
    SELECT * FROM joined
    WHERE _dispatch_status IS NULL OR dispatch_status = _dispatch_status
  ),
  counted AS (SELECT count(*)::bigint AS n FROM filtered)
  SELECT f.id, f.event_type, f.severity, f.description, f.metadata, f.created_at,
         f.dispatch_status, f.dispatched_at, f.admin_count, f.channels, f.error_message,
         (SELECT n FROM counted) AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT GREATEST(_limit, 1)
  OFFSET GREATEST(_offset, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_critical_alerts(integer, text[], text[], text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_critical_alerts(integer, text[], text[], text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_critical_alerts_summary(_hours integer DEFAULT 24)
RETURNS TABLE (
  event_type text,
  severity text,
  total bigint,
  sent bigint,
  failed bigint,
  pending bigint,
  last_seen timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since timestamptz := now() - make_interval(hours => GREATEST(_hours, 1));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT se.event_type,
         se.severity,
         count(*)::bigint AS total,
         count(*) FILTER (WHERE adl.status = 'sent')::bigint AS sent,
         count(*) FILTER (WHERE adl.status = 'failed')::bigint AS failed,
         count(*) FILTER (WHERE adl.status IS NULL)::bigint AS pending,
         max(se.created_at) AS last_seen
  FROM public.security_events se
  LEFT JOIN LATERAL (
    SELECT status FROM public.alert_dispatch_log
    WHERE security_event_id = se.id
    ORDER BY dispatched_at DESC
    LIMIT 1
  ) adl ON TRUE
  WHERE se.created_at >= _since
    AND se.severity IN ('critical','high','error','warning')
  GROUP BY se.event_type, se.severity
  ORDER BY total DESC, last_seen DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_critical_alerts_summary(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_critical_alerts_summary(integer) TO service_role;
