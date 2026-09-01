
CREATE OR REPLACE FUNCTION public.run_cron_job(_job_name TEXT, _sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_key BIGINT;
  started TIMESTAMPTZ := clock_timestamp();
  err_msg TEXT;
  duration_ms NUMERIC;
  recent_failures INT;
BEGIN
  lock_key := hashtext('cron:' || _job_name);
  IF NOT pg_try_advisory_lock(lock_key) THEN
    INSERT INTO public.cron_job_failures(job_name, status, error_message, duration_ms)
    VALUES (_job_name, 'skipped_locked', 'Job already running', 0);
    RETURN jsonb_build_object('status','skipped','reason','locked');
  END IF;

  BEGIN
    EXECUTE _sql;
    duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - started)) * 1000;
    INSERT INTO public.cron_job_failures(job_name, status, duration_ms)
    VALUES (_job_name, 'success', duration_ms);
    PERFORM pg_advisory_unlock(lock_key);
    RETURN jsonb_build_object('status','success','duration_ms',duration_ms);
  EXCEPTION WHEN OTHERS THEN
    err_msg := SQLERRM;
    duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - started)) * 1000;
    INSERT INTO public.cron_job_failures(job_name, status, error_message, duration_ms)
    VALUES (_job_name, 'failure', err_msg, duration_ms);

    SELECT COUNT(*) INTO recent_failures
      FROM public.cron_job_failures
      WHERE job_name = _job_name
        AND status = 'failure'
        AND created_at > now() - interval '24 hours';

    IF recent_failures >= 3 THEN
      INSERT INTO public.security_events(event_type, severity, description, metadata)
      VALUES (
        'cron_job_repeated_failure',
        'critical',
        'Cron job ' || _job_name || ' falhou ' || recent_failures || ' vezes em 24h',
        jsonb_build_object('job_name', _job_name, 'failures_24h', recent_failures, 'last_error', err_msg)
      );
    END IF;
    PERFORM pg_advisory_unlock(lock_key);
    RETURN jsonb_build_object('status','failure','error',err_msg);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.run_cron_job(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_cron_job(TEXT, TEXT) TO service_role;

-- Add missing columns to cron_job_failures if needed
ALTER TABLE public.cron_job_failures
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'failure',
  ADD COLUMN IF NOT EXISTS duration_ms NUMERIC;
