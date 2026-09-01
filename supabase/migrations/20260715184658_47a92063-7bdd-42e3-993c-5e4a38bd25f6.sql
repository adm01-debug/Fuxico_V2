-- Onda 83: Index advisor — detecta hot paths de seq scan candidatos a novos índices
CREATE OR REPLACE FUNCTION public.admin_index_advisor(min_seq_scans BIGINT DEFAULT 1000)
RETURNS TABLE(
  schema_name TEXT,
  table_name TEXT,
  seq_scan BIGINT,
  seq_tup_read BIGINT,
  avg_tuples_per_scan NUMERIC,
  idx_scan BIGINT,
  n_live_tup BIGINT,
  table_size TEXT,
  seq_scan_ratio_pct NUMERIC,
  recommendation TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;
  RETURN QUERY
  SELECT
    s.schemaname::TEXT,
    s.relname::TEXT,
    s.seq_scan,
    s.seq_tup_read,
    CASE WHEN s.seq_scan > 0 THEN ROUND(s.seq_tup_read::NUMERIC / s.seq_scan, 2) ELSE 0 END,
    COALESCE(s.idx_scan, 0),
    s.n_live_tup,
    pg_size_pretty(pg_total_relation_size(s.relid)),
    CASE WHEN (s.seq_scan + COALESCE(s.idx_scan,0)) > 0
      THEN ROUND(100.0 * s.seq_scan / (s.seq_scan + COALESCE(s.idx_scan,0)), 2)
      ELSE 0 END,
    CASE
      WHEN s.n_live_tup < 1000 THEN 'skip: small table, seq scan is optimal'
      WHEN COALESCE(s.idx_scan,0) = 0 AND s.seq_scan > min_seq_scans THEN 'HIGH: table never uses indexes — audit WHERE clauses and add indexes'
      WHEN s.seq_scan > COALESCE(s.idx_scan,0) * 10 AND s.n_live_tup > 10000 THEN 'MEDIUM: seq scans dominate — profile queries and add composite indexes'
      WHEN s.seq_tup_read::NUMERIC / GREATEST(s.seq_scan,1) > s.n_live_tup * 0.5 THEN 'LOW: seq reads too many rows per scan'
      ELSE 'ok'
    END
  FROM pg_stat_user_tables s
  WHERE s.schemaname = 'public'
    AND s.seq_scan >= min_seq_scans
  ORDER BY s.seq_tup_read DESC
  LIMIT 100;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_index_advisor(BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_index_advisor(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.admin_index_advisor IS
  'Onda 83: Ranqueia tabelas public por hot path de seq scan. Admin-only. Uso: SELECT * FROM admin_index_advisor(1000);';