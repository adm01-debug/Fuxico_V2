
DROP FUNCTION IF EXISTS public.cleanup_old_index_advisor_runs();

CREATE OR REPLACE FUNCTION public.cleanup_old_index_advisor_runs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff timestamptz := now() - interval '90 days';
  v_deleted integer := 0;
BEGIN
  WITH d AS (
    DELETE FROM public.index_advisor_runs
    WHERE ran_at < v_cutoff
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM d;

  INSERT INTO public.security_events (event_type, severity, description, metadata)
  VALUES (
    'index_advisor_cleanup',
    'info',
    'Cleanup automático do histórico index_advisor_runs',
    jsonb_build_object('deleted_count', v_deleted, 'cutoff', v_cutoff)
  );

  RETURN jsonb_build_object('deleted_count', v_deleted, 'cutoff', v_cutoff);
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_index_advisor_runs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_old_index_advisor_runs() TO service_role;

CREATE OR REPLACE FUNCTION public.admin_last_index_advisor_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.security_events%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_row
  FROM public.security_events
  WHERE event_type = 'index_advisor_cleanup'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'ran_at', v_row.created_at,
    'deleted_count', COALESCE((v_row.metadata->>'deleted_count')::int, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_last_index_advisor_cleanup() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_last_index_advisor_cleanup() TO authenticated, service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-index-advisor-cleanup');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'weekly-index-advisor-cleanup',
  '0 4 * * 0',
  $cron$ SELECT public.cleanup_old_index_advisor_runs(); $cron$
);
