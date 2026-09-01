
-- Tendência diária por índice
CREATE OR REPLACE FUNCTION public.admin_index_usage_trend(_days INT DEFAULT 30, _limit INT DEFAULT 20)
RETURNS TABLE(
  bucket_date DATE,
  index_name TEXT,
  table_name TEXT,
  total_scans BIGINT,
  avg_size_bytes NUMERIC,
  scans_delta BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH top_indexes AS (
    SELECT ius.index_name
      FROM public.index_usage_snapshots ius
     WHERE ius.snapshot_at >= now() - make_interval(days => _days)
     GROUP BY ius.index_name
     ORDER BY SUM(ius.idx_scan) DESC
     LIMIT _limit
  ),
  daily AS (
    SELECT
      date_trunc('day', ius.snapshot_at)::date AS bucket_date,
      ius.index_name,
      MAX(ius.table_name) AS table_name,
      MAX(ius.idx_scan) AS total_scans,
      AVG(ius.index_size_bytes)::numeric AS avg_size_bytes
    FROM public.index_usage_snapshots ius
    JOIN top_indexes t ON t.index_name = ius.index_name
    WHERE ius.snapshot_at >= now() - make_interval(days => _days)
    GROUP BY 1, 2
  )
  SELECT
    d.bucket_date,
    d.index_name,
    d.table_name,
    d.total_scans,
    d.avg_size_bytes,
    (d.total_scans - LAG(d.total_scans) OVER (PARTITION BY d.index_name ORDER BY d.bucket_date))::bigint AS scans_delta
  FROM daily d
  ORDER BY d.bucket_date DESC, d.total_scans DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_index_usage_trend(INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_index_usage_trend(INT, INT) TO service_role;

-- Ranking (mais e menos utilizados)
CREATE OR REPLACE FUNCTION public.admin_index_ranking(_period_days INT DEFAULT 30, _limit INT DEFAULT 25)
RETURNS TABLE(
  index_name TEXT,
  table_name TEXT,
  schema_name TEXT,
  period_scans BIGINT,
  current_size_bytes BIGINT,
  classification TEXT,
  rank_position INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH windowed AS (
    SELECT
      ius.index_name,
      MAX(ius.table_name) AS table_name,
      MAX(ius.schema_name) AS schema_name,
      MAX(ius.idx_scan) - MIN(ius.idx_scan) AS period_scans,
      (SELECT index_size_bytes FROM public.index_usage_snapshots x
        WHERE x.index_name = ius.index_name ORDER BY snapshot_at DESC LIMIT 1) AS current_size_bytes
    FROM public.index_usage_snapshots ius
    WHERE ius.snapshot_at >= now() - make_interval(days => _period_days)
    GROUP BY ius.index_name
  ),
  classified AS (
    SELECT
      w.*,
      CASE
        WHEN w.period_scans = 0 THEN 'cold'
        WHEN w.period_scans < 100 THEN 'cool'
        WHEN w.period_scans < 10000 THEN 'warm'
        ELSE 'hot'
      END AS classification
    FROM windowed w
  ),
  top_hot AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.period_scans DESC) AS rank_position
      FROM classified c
     WHERE c.period_scans > 0
     ORDER BY c.period_scans DESC
     LIMIT _limit
  ),
  top_cold AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.current_size_bytes DESC) AS rank_position
      FROM classified c
     WHERE c.classification IN ('cold','cool')
     ORDER BY c.current_size_bytes DESC NULLS LAST
     LIMIT _limit
  )
  SELECT index_name, table_name, schema_name, period_scans, current_size_bytes, classification, rank_position::int
    FROM top_hot
  UNION ALL
  SELECT index_name, table_name, schema_name, period_scans, current_size_bytes, classification, rank_position::int
    FROM top_cold;
$$;

REVOKE ALL ON FUNCTION public.admin_index_ranking(INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_index_ranking(INT, INT) TO service_role;

-- Agrupamento por tabela
CREATE OR REPLACE FUNCTION public.admin_index_usage_by_table(_period_days INT DEFAULT 30)
RETURNS TABLE(
  schema_name TEXT,
  table_name TEXT,
  index_count BIGINT,
  total_scans BIGINT,
  total_size_bytes BIGINT,
  cold_indexes BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_index AS (
    SELECT
      ius.schema_name,
      ius.table_name,
      ius.index_name,
      MAX(ius.idx_scan) - MIN(ius.idx_scan) AS period_scans,
      (SELECT index_size_bytes FROM public.index_usage_snapshots x
        WHERE x.index_name = ius.index_name ORDER BY snapshot_at DESC LIMIT 1) AS current_size_bytes
    FROM public.index_usage_snapshots ius
    WHERE ius.snapshot_at >= now() - make_interval(days => _period_days)
    GROUP BY 1, 2, 3
  )
  SELECT
    schema_name,
    table_name,
    COUNT(*)::bigint AS index_count,
    COALESCE(SUM(period_scans),0)::bigint AS total_scans,
    COALESCE(SUM(current_size_bytes),0)::bigint AS total_size_bytes,
    COUNT(*) FILTER (WHERE period_scans = 0)::bigint AS cold_indexes
  FROM per_index
  GROUP BY schema_name, table_name
  ORDER BY total_size_bytes DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_index_usage_by_table(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_index_usage_by_table(INT) TO service_role;
