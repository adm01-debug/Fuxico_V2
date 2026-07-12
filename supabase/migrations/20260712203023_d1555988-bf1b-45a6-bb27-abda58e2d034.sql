
-- ONDA 18 — Query performance history + regression detection

CREATE TABLE IF NOT EXISTS public.query_performance_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  queryid BIGINT,
  query_text TEXT NOT NULL,
  calls BIGINT NOT NULL,
  total_exec_ms NUMERIC NOT NULL,
  mean_exec_ms NUMERIC NOT NULL,
  max_exec_ms NUMERIC NOT NULL,
  stddev_exec_ms NUMERIC,
  rows BIGINT,
  cache_hit_ratio_pct NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.query_performance_snapshots TO authenticated;
GRANT ALL ON public.query_performance_snapshots TO service_role;

ALTER TABLE public.query_performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view query snapshots"
ON public.query_performance_snapshots FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_qps_snapshot_at ON public.query_performance_snapshots (snapshot_at DESC);
CREATE INDEX idx_qps_queryid ON public.query_performance_snapshots (queryid, snapshot_at DESC);
CREATE INDEX idx_qps_mean_exec ON public.query_performance_snapshots (snapshot_at DESC, mean_exec_ms DESC);

-- Snapshot function (chamada horária)
CREATE OR REPLACE FUNCTION public.capture_query_performance_snapshot()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_inserted integer;
BEGIN
  INSERT INTO public.query_performance_snapshots
    (queryid, query_text, calls, total_exec_ms, mean_exec_ms, max_exec_ms, stddev_exec_ms, rows, cache_hit_ratio_pct)
  SELECT
    s.queryid,
    LEFT(s.query, 2000),
    s.calls,
    ROUND(s.total_exec_time::numeric, 2),
    ROUND(s.mean_exec_time::numeric, 2),
    ROUND(s.max_exec_time::numeric, 2),
    ROUND(s.stddev_exec_time::numeric, 2),
    s.rows,
    CASE WHEN s.shared_blks_hit + s.shared_blks_read > 0
         THEN ROUND((s.shared_blks_hit::numeric / (s.shared_blks_hit + s.shared_blks_read)) * 100, 2)
         ELSE NULL END
  FROM pg_stat_statements s
  JOIN pg_database d ON d.oid = s.dbid
  WHERE d.datname = current_database()
    AND s.calls >= 5
    AND s.query NOT ILIKE '%pg_stat_statements%'
    AND s.query NOT ILIKE '%query_performance_snapshots%'
  ORDER BY s.mean_exec_time DESC
  LIMIT 50;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Retenção 30 dias
  DELETE FROM public.query_performance_snapshots WHERE snapshot_at < now() - interval '30 days';
  RETURN v_inserted;
END; $$;

REVOKE ALL ON FUNCTION public.capture_query_performance_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_query_performance_snapshot() TO service_role;

-- Detector de regressões — compara última hora vs média das últimas 24h
CREATE OR REPLACE FUNCTION public.admin_query_regressions(_threshold_pct numeric DEFAULT 50)
RETURNS TABLE(
  queryid bigint,
  query_text text,
  current_mean_ms numeric,
  baseline_mean_ms numeric,
  regression_pct numeric,
  current_calls bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH current_window AS (
    SELECT qps.queryid, AVG(qps.mean_exec_ms) AS cur_mean, MAX(qps.query_text) AS q, SUM(qps.calls) AS cur_calls
    FROM public.query_performance_snapshots qps
    WHERE qps.snapshot_at >= now() - interval '1 hour'
    GROUP BY qps.queryid
  ),
  baseline AS (
    SELECT qps.queryid, AVG(qps.mean_exec_ms) AS base_mean
    FROM public.query_performance_snapshots qps
    WHERE qps.snapshot_at BETWEEN now() - interval '25 hours' AND now() - interval '1 hour'
    GROUP BY qps.queryid
  )
  SELECT
    c.queryid,
    LEFT(c.q, 500),
    ROUND(c.cur_mean, 2),
    ROUND(b.base_mean, 2),
    ROUND(((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) * 100, 2),
    c.cur_calls
  FROM current_window c
  JOIN baseline b ON b.queryid = c.queryid
  WHERE b.base_mean > 1
    AND ((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) * 100 >= _threshold_pct
  ORDER BY ((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) DESC
  LIMIT 50;
END; $$;

REVOKE ALL ON FUNCTION public.admin_query_regressions(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_query_regressions(numeric) TO authenticated;
