
-- 1) Tabela de histórico
CREATE TABLE IF NOT EXISTS public.index_advisor_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  high_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  triggered_by TEXT NOT NULL DEFAULT 'cron',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_index_advisor_runs_ran_at
  ON public.index_advisor_runs (ran_at DESC);

GRANT SELECT ON public.index_advisor_runs TO authenticated;
GRANT ALL ON public.index_advisor_runs TO service_role;

ALTER TABLE public.index_advisor_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view advisor runs" ON public.index_advisor_runs;
CREATE POLICY "Admins can view advisor runs"
  ON public.index_advisor_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Atualiza run_index_advisor_check para persistir na tabela
CREATE OR REPLACE FUNCTION public.run_index_advisor_check(_triggered_by TEXT DEFAULT 'cron')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_details JSONB;
  v_high INTEGER := 0;
  v_medium INTEGER := 0;
  v_run_id UUID;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO v_details
  FROM public.admin_index_advisor(1000) r
  WHERE r.severity IN ('HIGH','MEDIUM');

  SELECT
    COALESCE(SUM(CASE WHEN (elem->>'severity') = 'HIGH' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN (elem->>'severity') = 'MEDIUM'
                       AND COALESCE((elem->>'live_tuples')::bigint, 0) > 100000
                      THEN 1 ELSE 0 END), 0)
  INTO v_high, v_medium
  FROM jsonb_array_elements(v_details) elem;

  INSERT INTO public.index_advisor_runs (high_count, medium_count, details, triggered_by)
  VALUES (v_high, v_medium, v_details, COALESCE(_triggered_by, 'cron'))
  RETURNING id INTO v_run_id;

  IF v_high > 0 THEN
    INSERT INTO public.security_events (event_type, severity, description, metadata)
    VALUES (
      'index_advisor_high',
      'high',
      'Index advisor detectou tabelas com uso crítico de seq scan',
      jsonb_build_object('run_id', v_run_id, 'high_count', v_high, 'medium_count', v_medium)
    );
  END IF;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'ran_at', now(),
    'high_count', v_high,
    'medium_count', v_medium,
    'details', v_details
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_index_advisor_check(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.run_index_advisor_check(TEXT) TO authenticated, service_role;

-- 3) Wrapper admin para listagem
CREATE OR REPLACE FUNCTION public.admin_list_index_advisor_runs(_limit INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  ran_at TIMESTAMPTZ,
  high_count INTEGER,
  medium_count INTEGER,
  triggered_by TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT r.id, r.ran_at, r.high_count, r.medium_count, r.triggered_by, r.details
  FROM public.index_advisor_runs r
  ORDER BY r.ran_at DESC
  LIMIT COALESCE(_limit, 30);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_index_advisor_runs(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_index_advisor_runs(INTEGER) TO authenticated, service_role;

-- 4) Wrapper admin para execução manual
CREATE OR REPLACE FUNCTION public.admin_run_index_advisor()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN public.run_index_advisor_check('manual');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_run_index_advisor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_run_index_advisor() TO authenticated, service_role;
