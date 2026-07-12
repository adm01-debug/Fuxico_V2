
CREATE TABLE IF NOT EXISTS public.alert_dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_event_id UUID NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
  error_message TEXT,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (security_event_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_alert_dispatch_log_dispatched_at ON public.alert_dispatch_log (dispatched_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_dispatch_log_event ON public.alert_dispatch_log (security_event_id);

GRANT SELECT ON public.alert_dispatch_log TO authenticated;
GRANT ALL ON public.alert_dispatch_log TO service_role;

ALTER TABLE public.alert_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view dispatch log"
  ON public.alert_dispatch_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
