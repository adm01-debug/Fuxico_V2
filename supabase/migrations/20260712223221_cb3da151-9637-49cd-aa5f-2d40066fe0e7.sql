
-- Onda 45 — Histórico de uso de índices (trend analysis)

CREATE TABLE IF NOT EXISTS public.index_usage_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  schema_name text NOT NULL,
  table_name text NOT NULL,
  index_name text NOT NULL,
  idx_scan bigint NOT NULL,
  idx_tup_read bigint NOT NULL,
  idx_tup_fetch bigint NOT NULL,
  index_size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_index_usage_snapshots_snapshot_at ON public.index_usage_snapshots (snapshot_at DESC);
CREATE INDEX idx_index_usage_snapshots_index ON public.index_usage_snapshots (schema_name, table_name, index_name, snapshot_at DESC);

GRANT SELECT ON public.index_usage_snapshots TO authenticated;
GRANT ALL ON public.index_usage_snapshots TO service_role;

ALTER TABLE public.index_usage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view index usage snapshots"
ON public.index_usage_snapshots
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Função de captura (service_role only)
CREATE OR REPLACE FUNCTION public.capture_index_usage_snapshot()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT pg_try_advisory_lock(hashtextextended('capture_index_usage', 0)) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.index_usage_snapshots
    (schema_name, table_name, index_name, idx_scan, idx_tup_read, idx_tup_fetch, index_size_bytes)
  SELECT
    s.schemaname,
    s.relname,
    s.indexrelname,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    pg_relation_size(s.indexrelid)
  FROM pg_stat_user_indexes s
  WHERE s.schemaname = 'public';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Retenção 90 dias
  DELETE FROM public.index_usage_snapshots WHERE snapshot_at < now() - interval '90 days';

  PERFORM pg_advisory_unlock(hashtextextended('capture_index_usage', 0));
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_index_usage_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_index_usage_snapshot() TO service_role;

-- Função admin: retorna índices que não tiveram novos scans em 30 dias (candidatos a drop)
CREATE OR REPLACE FUNCTION public.admin_stale_indexes(_days integer DEFAULT 30)
RETURNS TABLE(
  schema_name text,
  table_name text,
  index_name text,
  current_scans bigint,
  scans_delta bigint,
  index_size text,
  first_seen timestamptz,
  last_seen timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (schema_name, table_name, index_name)
      schema_name, table_name, index_name, idx_scan, index_size_bytes, snapshot_at
    FROM public.index_usage_snapshots
    ORDER BY schema_name, table_name, index_name, snapshot_at DESC
  ),
  oldest AS (
    SELECT DISTINCT ON (schema_name, table_name, index_name)
      schema_name, table_name, index_name, idx_scan, snapshot_at
    FROM public.index_usage_snapshots
    WHERE snapshot_at >= now() - (_days || ' days')::interval
    ORDER BY schema_name, table_name, index_name, snapshot_at ASC
  )
  SELECT
    l.schema_name,
    l.table_name,
    l.index_name,
    l.idx_scan,
    (l.idx_scan - COALESCE(o.idx_scan, 0)) AS scans_delta,
    pg_size_pretty(l.index_size_bytes),
    o.snapshot_at,
    l.snapshot_at
  FROM latest l
  LEFT JOIN oldest o USING (schema_name, table_name, index_name)
  WHERE (l.idx_scan - COALESCE(o.idx_scan, 0)) = 0
    AND l.index_size_bytes > 1024 * 1024  -- > 1MB só, ignorar ruído
    AND l.index_name NOT LIKE '%_pkey'
    AND l.index_name NOT LIKE '%_key'
  ORDER BY l.index_size_bytes DESC
  LIMIT 100;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_stale_indexes(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stale_indexes(integer) TO authenticated, service_role;

-- Cron semanal: domingo 05:00 UTC
DO $$
DECLARE v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'fuxico-capture-index-usage';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
  PERFORM cron.schedule(
    'fuxico-capture-index-usage',
    '0 5 * * 0',
    $sql$SELECT public.capture_index_usage_snapshot();$sql$
  );
END $$;

-- Primeiro snapshot imediato para inicializar baseline
SELECT public.capture_index_usage_snapshot();
