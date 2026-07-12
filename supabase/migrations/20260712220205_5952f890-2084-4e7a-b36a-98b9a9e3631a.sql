-- Onda 31: DLQ + safe_http_post
CREATE TABLE IF NOT EXISTS public.cron_job_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  request_url TEXT NOT NULL,
  request_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_body JSONB,
  error_message TEXT,
  http_status INT,
  attempts INT NOT NULL DEFAULT 1,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_job_failures_unresolved
  ON public.cron_job_failures(created_at DESC)
  WHERE resolved_at IS NULL;

GRANT SELECT ON public.cron_job_failures TO authenticated;
GRANT ALL ON public.cron_job_failures TO service_role;

ALTER TABLE public.cron_job_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_failures FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view cron failures" ON public.cron_job_failures;
CREATE POLICY "Admins can view cron failures" ON public.cron_job_failures
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update cron failures" ON public.cron_job_failures;
CREATE POLICY "Admins can update cron failures" ON public.cron_job_failures
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_cron_job_failures_updated_at ON public.cron_job_failures;
CREATE TRIGGER update_cron_job_failures_updated_at
  BEFORE UPDATE ON public.cron_job_failures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- safe_http_post: chama pg_net e persiste falha em DLQ se o request_id vier NULL
CREATE OR REPLACE FUNCTION public.safe_http_post(
  _job_name TEXT,
  _url TEXT,
  _headers JSONB,
  _body JSONB
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id BIGINT;
BEGIN
  BEGIN
    SELECT net.http_post(url:=_url, headers:=_headers, body:=_body)
      INTO v_request_id;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.cron_job_failures(job_name, request_url, request_headers, request_body, error_message)
    VALUES (_job_name, _url, _headers, _body, SQLERRM);
    RETURN NULL;
  END;

  IF v_request_id IS NULL THEN
    INSERT INTO public.cron_job_failures(job_name, request_url, request_headers, request_body, error_message)
    VALUES (_job_name, _url, _headers, _body, 'pg_net returned NULL request_id');
  END IF;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.safe_http_post(TEXT, TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.safe_http_post(TEXT, TEXT, JSONB, JSONB) TO service_role;

-- Reprocessamento manual (admin)
CREATE OR REPLACE FUNCTION public.replay_cron_failure(_failure_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_request_id BIGINT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO r FROM public.cron_job_failures WHERE id = _failure_id AND resolved_at IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_request_id := public.safe_http_post(r.job_name, r.request_url, r.request_headers, r.request_body);

  UPDATE public.cron_job_failures
    SET attempts = attempts + 1,
        resolved_at = CASE WHEN v_request_id IS NOT NULL THEN now() ELSE resolved_at END,
        resolved_by = CASE WHEN v_request_id IS NOT NULL THEN auth.uid() ELSE resolved_by END,
        updated_at = now()
  WHERE id = _failure_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.replay_cron_failure(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replay_cron_failure(UUID) TO authenticated, service_role;