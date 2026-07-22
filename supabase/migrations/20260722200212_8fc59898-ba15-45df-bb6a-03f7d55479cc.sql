
CREATE TABLE IF NOT EXISTS public.dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'export' CHECK (request_type IN ('export','deletion','rectification')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','expired')),
  export_path TEXT,
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 days'),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dsar_requests_user ON public.dsar_requests(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_status ON public.dsar_requests(status, deadline_at) WHERE status IN ('pending','processing');

GRANT SELECT, INSERT ON public.dsar_requests TO authenticated;
GRANT ALL ON public.dsar_requests TO service_role;

ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own DSAR"
  ON public.dsar_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users create own DSAR"
  ON public.dsar_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role manages DSAR"
  ON public.dsar_requests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_dsar_requests_updated_at
  BEFORE UPDATE ON public.dsar_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SLA miss counter for health score
CREATE OR REPLACE FUNCTION public.count_dsar_sla_misses()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT FROM public.dsar_requests
  WHERE status IN ('pending','processing')
    AND deadline_at < now();
$$;
REVOKE ALL ON FUNCTION public.count_dsar_sla_misses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_dsar_sla_misses() TO service_role;
