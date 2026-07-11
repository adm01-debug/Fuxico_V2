
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending_due
  ON public.scheduled_emails (scheduled_at)
  WHERE status IN ('pending','scheduled');

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_active_due
  ON public.sequence_enrollments (next_step_at)
  WHERE status = 'active' AND next_step_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_pending_due
  ON public.follow_up_reminders (created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bounce_alerts_unresolved
  ON public.bounce_alerts (user_id, created_at DESC)
  WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_unresolved
  ON public.fraud_alerts (user_id, created_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_login_attempts_failures_recent
  ON public.login_attempts (email, ip_address, created_at DESC)
  WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_active
  ON public.password_reset_tokens (token)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_active
  ON public.email_verification_tokens (token)
  WHERE verified_at IS NULL;

ANALYZE public.scheduled_emails;
ANALYZE public.sequence_enrollments;
ANALYZE public.follow_up_reminders;
ANALYZE public.bounce_alerts;
ANALYZE public.fraud_alerts;
ANALYZE public.login_attempts;
ANALYZE public.password_reset_tokens;
ANALYZE public.email_verification_tokens;
