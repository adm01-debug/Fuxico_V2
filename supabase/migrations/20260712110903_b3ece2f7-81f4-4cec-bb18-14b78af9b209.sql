
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_type_created
  ON public.tracking_events (tracking_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_ip
  ON public.tracking_events (tracking_id, ip_address)
  WHERE ip_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_created
  ON public.tracked_emails (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_status_created
  ON public.tracked_emails (user_id, delivery_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_recipient
  ON public.tracked_emails (user_id, recipient_email);

CREATE INDEX IF NOT EXISTS brin_webhook_logs_created_at
  ON public.webhook_logs USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_rate_limit_logs_created_at
  ON public.rate_limit_logs USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_security_events_created_at
  ON public.security_events USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_audit_logs_created_at
  ON public.audit_logs USING BRIN (created_at) WITH (pages_per_range = 32);

ANALYZE public.tracking_events;
ANALYZE public.tracked_emails;
ANALYZE public.webhook_logs;
ANALYZE public.rate_limit_logs;
ANALYZE public.security_events;
ANALYZE public.audit_logs;
