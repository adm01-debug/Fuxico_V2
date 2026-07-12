
CREATE OR REPLACE FUNCTION public.admin_list_cron_failures(_limit int DEFAULT 100)
RETURNS TABLE(
  id uuid,
  job_name text,
  url text,
  status_code int,
  error_message text,
  attempts int,
  replayed_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT cjf.id, cjf.job_name, cjf.url, cjf.status_code, cjf.error_message,
         COALESCE(cjf.attempts, 1), cjf.replayed_at, cjf.created_at
  FROM public.cron_job_failures cjf
  ORDER BY cjf.created_at DESC
  LIMIT LEAST(_limit, 500);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_replay_cron_failure(_failure_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT public.replay_cron_failure(_failure_id) INTO v_result;
  RETURN v_result;
END; $$;

REVOKE ALL ON FUNCTION public.admin_list_cron_failures(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_failures(int) TO service_role;

REVOKE ALL ON FUNCTION public.admin_replay_cron_failure(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_replay_cron_failure(uuid) TO service_role;
