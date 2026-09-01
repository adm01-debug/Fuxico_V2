
ALTER TABLE public.ab_tests
  DROP CONSTRAINT IF EXISTS ab_tests_recipient_email_nonempty,
  ALTER COLUMN recipient_email DROP NOT NULL;

ALTER TABLE public.tracked_documents
  DROP CONSTRAINT IF EXISTS tracked_documents_recipient_email_nonempty,
  ALTER COLUMN recipient_email DROP NOT NULL;

ALTER TABLE public.scheduled_emails
  DROP CONSTRAINT IF EXISTS scheduled_emails_sender_email_nonempty,
  ALTER COLUMN sender_email DROP NOT NULL;
