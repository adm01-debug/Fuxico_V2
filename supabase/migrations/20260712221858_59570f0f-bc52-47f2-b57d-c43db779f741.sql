-- Onda 37: MV agregada mensal de tracking_events

DROP MATERIALIZED VIEW IF EXISTS public.tracking_events_monthly_agg;

CREATE MATERIALIZED VIEW public.tracking_events_monthly_agg AS
SELECT
  date_trunc('month', te.created_at)::date AS month,
  te.tracking_id,
  te.event_type,
  COUNT(*)::bigint AS event_count,
  COUNT(DISTINCT te.ip_address)::bigint AS distinct_ips,
  MIN(te.created_at) AS first_event_at,
  MAX(te.created_at) AS last_event_at
FROM public.tracking_events te
WHERE te.is_self_open IS NOT TRUE
GROUP BY 1, 2, 3
WITH NO DATA;

CREATE UNIQUE INDEX idx_tracking_monthly_agg_pk
  ON public.tracking_events_monthly_agg (month, tracking_id, event_type);

CREATE INDEX idx_tracking_monthly_agg_month
  ON public.tracking_events_monthly_agg (month DESC);

CREATE INDEX idx_tracking_monthly_agg_tracking
  ON public.tracking_events_monthly_agg (tracking_id);

REVOKE ALL ON public.tracking_events_monthly_agg FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.tracking_events_monthly_agg TO service_role;

-- Função de refresh
CREATE OR REPLACE FUNCTION public.refresh_tracking_events_monthly_agg()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.tracking_events_monthly_agg;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW public.tracking_events_monthly_agg;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_tracking_events_monthly_agg() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_tracking_events_monthly_agg() TO service_role;

COMMENT ON MATERIALIZED VIEW public.tracking_events_monthly_agg IS
  'Agregação mensal de tracking_events (Onda 37). Preserva histórico após purge da tabela raw.';