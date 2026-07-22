
CREATE TABLE IF NOT EXISTS public.schema_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot JSONB NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_schema_snapshots_captured ON public.schema_snapshots(captured_at DESC);

GRANT SELECT ON public.schema_snapshots TO authenticated;
GRANT ALL ON public.schema_snapshots TO service_role;

ALTER TABLE public.schema_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view schema snapshots"
  ON public.schema_snapshots FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.snapshot_schema()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  snap JSONB;
  new_id UUID;
BEGIN
  SELECT jsonb_build_object(
    'columns', (
      SELECT jsonb_agg(jsonb_build_object(
        'table', table_name, 'column', column_name, 'type', data_type, 'nullable', is_nullable
      ) ORDER BY table_name, column_name)
      FROM information_schema.columns WHERE table_schema = 'public'
    ),
    'indexes', (
      SELECT jsonb_agg(jsonb_build_object('table', tablename, 'index', indexname) ORDER BY tablename, indexname)
      FROM pg_indexes WHERE schemaname = 'public'
    ),
    'policies', (
      SELECT jsonb_agg(jsonb_build_object('table', tablename, 'policy', policyname, 'cmd', cmd) ORDER BY tablename, policyname)
      FROM pg_policies WHERE schemaname = 'public'
    )
  ) INTO snap;
  INSERT INTO public.schema_snapshots(snapshot) VALUES (snap) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_detect_schema_drift()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  latest JSONB;
  prev JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT snapshot INTO latest FROM public.schema_snapshots ORDER BY captured_at DESC LIMIT 1;
  SELECT snapshot INTO prev FROM public.schema_snapshots ORDER BY captured_at DESC OFFSET 1 LIMIT 1;
  IF prev IS NULL THEN
    RETURN jsonb_build_object('status','baseline_only');
  END IF;
  RETURN jsonb_build_object(
    'removed_columns', (SELECT jsonb_agg(x) FROM (SELECT jsonb_array_elements(prev->'columns') EXCEPT SELECT jsonb_array_elements(latest->'columns')) t(x)),
    'added_columns', (SELECT jsonb_agg(x) FROM (SELECT jsonb_array_elements(latest->'columns') EXCEPT SELECT jsonb_array_elements(prev->'columns')) t(x)),
    'removed_indexes', (SELECT jsonb_agg(x) FROM (SELECT jsonb_array_elements(prev->'indexes') EXCEPT SELECT jsonb_array_elements(latest->'indexes')) t(x)),
    'removed_policies', (SELECT jsonb_agg(x) FROM (SELECT jsonb_array_elements(prev->'policies') EXCEPT SELECT jsonb_array_elements(latest->'policies')) t(x))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_schema() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_detect_schema_drift() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.snapshot_schema() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_detect_schema_drift() TO authenticated;

-- Weekly snapshot cron
DO $$ BEGIN
  PERFORM cron.schedule(
    'fuxico-schema-snapshot-weekly',
    '0 5 * * 1',
    $CRON$ SELECT public.snapshot_schema(); $CRON$
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
