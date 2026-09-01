
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_tracked_emails_subject_trgm
  ON public.tracked_emails USING gin (subject gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tracked_emails_recipient_trgm
  ON public.tracked_emails USING gin (recipient_email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tracked_emails_sender_trgm
  ON public.tracked_emails USING gin (sender_email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contact_scores_email_trgm
  ON public.contact_scores USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_audit_logs_description_trgm
  ON public.audit_logs USING gin (description gin_trgm_ops);

ANALYZE public.tracked_emails;
ANALYZE public.contact_scores;
ANALYZE public.audit_logs;
