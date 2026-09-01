
-- ONDA 17 — Bloat estimator + cache hit ratio + blocking queries

-- Estimador de bloat (heap + índices) — admin-only
CREATE OR REPLACE FUNCTION public.admin_table_bloat()
RETURNS TABLE(
  schema_name text,
  table_name text,
  total_size text,
  table_size text,
  bloat_size text,
  bloat_ratio_pct numeric,
  live_rows bigint,
  dead_rows bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    s.schemaname::text,
    s.relname::text,
    pg_size_pretty(pg_total_relation_size(c.oid)),
    pg_size_pretty(pg_relation_size(c.oid)),
    pg_size_pretty(GREATEST(0, (s.n_dead_tup::numeric / NULLIF(s.n_live_tup + s.n_dead_tup, 0)) * pg_relation_size(c.oid))::bigint),
    ROUND((s.n_dead_tup::numeric / NULLIF(s.n_live_tup + s.n_dead_tup, 0) * 100)::numeric, 2),
    s.n_live_tup,
    s.n_dead_tup
  FROM pg_stat_user_tables s
  JOIN pg_class c ON c.oid = s.relid
  WHERE s.schemaname = 'public'
    AND s.n_live_tup + s.n_dead_tup > 0
  ORDER BY s.n_dead_tup DESC
  LIMIT 50;
END; $$;

REVOKE ALL ON FUNCTION public.admin_table_bloat() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_table_bloat() TO authenticated;

-- Cache hit ratio (deve ficar > 99% para OLTP saudável)
CREATE OR REPLACE VIEW public.admin_cache_hit_ratio
WITH (security_invoker = true) AS
SELECT
  'index' AS cache_type,
  ROUND(SUM(idx_blks_hit)::numeric / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0) * 100, 2) AS hit_ratio_pct,
  SUM(idx_blks_hit) AS hits,
  SUM(idx_blks_read) AS reads
FROM pg_statio_user_indexes
WHERE public.has_role(auth.uid(), 'admin'::app_role)
UNION ALL
SELECT
  'table' AS cache_type,
  ROUND(SUM(heap_blks_hit)::numeric / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100, 2),
  SUM(heap_blks_hit),
  SUM(heap_blks_read)
FROM pg_statio_user_tables
WHERE public.has_role(auth.uid(), 'admin'::app_role);

REVOKE ALL ON public.admin_cache_hit_ratio FROM PUBLIC, anon;
GRANT SELECT ON public.admin_cache_hit_ratio TO authenticated;

-- Blocking queries em tempo real
CREATE OR REPLACE FUNCTION public.admin_blocking_queries()
RETURNS TABLE(
  blocked_pid integer,
  blocked_user text,
  blocked_query text,
  blocking_pid integer,
  blocking_user text,
  blocking_query text,
  waited_seconds numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    blocked.pid,
    blocked.usename::text,
    LEFT(blocked.query, 500),
    blocking.pid,
    blocking.usename::text,
    LEFT(blocking.query, 500),
    ROUND(EXTRACT(EPOCH FROM (now() - blocked.query_start))::numeric, 2)
  FROM pg_stat_activity blocked
  JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
  WHERE blocked.wait_event_type = 'Lock'
  ORDER BY blocked.query_start ASC;
END; $$;

REVOKE ALL ON FUNCTION public.admin_blocking_queries() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_blocking_queries() TO authenticated;
