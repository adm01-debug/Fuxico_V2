
-- Retention function
CREATE OR REPLACE FUNCTION public.cleanup_old_index_advisor_runs()
RETURNS TABLE(deleted_count BIGINT, cutoff TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cutoff TIMESTAMPTZ := now() - INTERVAL '90 days';
  _deleted BIGINT;
BEGIN
  WITH d AS (
    DELETE FROM public.index_advisor_runs
    WHERE ran_at < _cutoff
    RETURNING 1
  )
  SELECT count(*) INTO _deleted FROM d;

  RETURN QUERY SELECT _deleted, _cutoff;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_index_advisor_runs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_old_index_advisor_runs() TO service_role;

-- Admin manual wrapper (checks role)
CREATE OR REPLACE FUNCTION public.admin_cleanup_index_advisor_runs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  SELECT * INTO _row FROM public.cleanup_old_index_advisor_runs();
  RETURN jsonb_build_object(
    'deleted_count', _row.deleted_count,
    'cutoff', _row.cutoff
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_cleanup_index_advisor_runs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_cleanup_index_advisor_runs() TO authenticated, service_role;

-- Weekly cron: Sundays 04:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('weekly-index-advisor-cleanup')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-index-advisor-cleanup');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'weekly-index-advisor-cleanup',
  '0 4 * * 0',
  $$SELECT public.cleanup_old_index_advisor_runs();$$
);
