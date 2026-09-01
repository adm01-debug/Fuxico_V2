
-- 1) Tabela de snapshots
CREATE TABLE IF NOT EXISTS public.health_score_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score numeric(4,2) NOT NULL,
  grade text NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.health_score_snapshots TO authenticated;
GRANT ALL ON public.health_score_snapshots TO service_role;

ALTER TABLE public.health_score_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view health score snapshots" ON public.health_score_snapshots;
CREATE POLICY "Admins can view health score snapshots"
  ON public.health_score_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_health_score_snapshots_created_at
  ON public.health_score_snapshots(created_at DESC);

-- 2) RPC: capturar snapshot
CREATE OR REPLACE FUNCTION public.admin_capture_health_score_snapshot(_source text DEFAULT 'manual')
RETURNS public.health_score_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_cron boolean := (v_uid IS NULL AND _source = 'cron');
  v_result jsonb;
  v_row public.health_score_snapshots;
BEGIN
  IF NOT v_is_cron AND NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  v_result := public.admin_system_health_score();

  INSERT INTO public.health_score_snapshots (score, grade, breakdown, captured_by, source)
  VALUES (
    COALESCE((v_result->>'score')::numeric, 0),
    COALESCE(v_result->>'grade', 'F'),
    COALESCE(v_result->'breakdown', '{}'::jsonb),
    v_uid,
    COALESCE(_source, 'manual')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_capture_health_score_snapshot(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_capture_health_score_snapshot(text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_capture_health_score_snapshot(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_capture_health_score_snapshot(text) TO service_role;

-- 3) RPC: listar histórico
CREATE OR REPLACE FUNCTION public.admin_list_health_score_snapshots(_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  score numeric,
  grade text,
  breakdown jsonb,
  captured_by uuid,
  source text,
  created_at timestamptz
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
  SELECT s.id, s.score, s.grade, s.breakdown, s.captured_by, s.source, s.created_at
  FROM public.health_score_snapshots s
  WHERE (SELECT ok FROM auth_check)
  ORDER BY s.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 500);
$$;

REVOKE ALL ON FUNCTION public.admin_list_health_score_snapshots(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_health_score_snapshots(int) FROM anon;
REVOKE ALL ON FUNCTION public.admin_list_health_score_snapshots(int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_health_score_snapshots(int) TO service_role;

-- 4) Snapshot diário via cron (08:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('daily-health-score-snapshot')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-health-score-snapshot');

    PERFORM cron.schedule(
      'daily-health-score-snapshot',
      '0 8 * * *',
      $cron$SELECT public.admin_capture_health_score_snapshot('cron');$cron$
    );
  END IF;
END $$;
