
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_tracked_emails_subject_trgm
  ON public.tracked_emails USING gin (subject gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tracked_emails_recipient_trgm
  ON public.tracked_emails USING gin (recipient_email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contact_scores_user_engagement
  ON public.contact_scores (user_id, engagement_score DESC, last_interaction_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created
  ON public.security_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

DO $$
DECLARE
  target_month DATE;
  partition_name TEXT;
  m DATE := date_trunc('month', now())::date;
BEGIN
  FOR i IN -1..3 LOOP
    target_month := (m + (i || ' months')::interval)::date;
    partition_name := 'tracking_events_' || to_char(target_month, 'YYYY_MM');
    BEGIN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (tracking_id, created_at DESC)',
        'idx_' || partition_name || '_tid_created',
        partition_name
      );
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'partição % ausente', partition_name;
    END;
  END LOOP;
END $$;

ANALYZE public.tracked_emails;
ANALYZE public.contact_scores;
ANALYZE public.security_events;
