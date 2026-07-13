
-- Onda 60: NOT NULL + CHECK em colunas críticas
ALTER TABLE public.tracked_emails
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN sender_email SET NOT NULL,
  ADD CONSTRAINT tracked_emails_sender_email_nonempty CHECK (length(trim(sender_email)) > 0);

ALTER TABLE public.tracked_documents
  ALTER COLUMN recipient_email SET NOT NULL,
  ADD CONSTRAINT tracked_documents_recipient_email_nonempty CHECK (length(trim(recipient_email)) > 0);

ALTER TABLE public.ab_tests
  ALTER COLUMN recipient_email SET NOT NULL,
  ADD CONSTRAINT ab_tests_recipient_email_nonempty CHECK (length(trim(recipient_email)) > 0);

ALTER TABLE public.email_audit_logs
  ALTER COLUMN recipient_email SET NOT NULL,
  ALTER COLUMN sender_email SET NOT NULL,
  ADD CONSTRAINT email_audit_logs_recipient_email_nonempty CHECK (length(trim(recipient_email)) > 0),
  ADD CONSTRAINT email_audit_logs_sender_email_nonempty CHECK (length(trim(sender_email)) > 0);

ALTER TABLE public.scheduled_emails
  ALTER COLUMN sender_email SET NOT NULL,
  ADD CONSTRAINT scheduled_emails_sender_email_nonempty CHECK (length(trim(sender_email)) > 0);
