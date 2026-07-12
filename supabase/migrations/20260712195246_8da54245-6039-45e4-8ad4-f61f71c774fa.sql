CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_created_covering
  ON public.tracked_emails (user_id, created_at DESC)
  INCLUDE (tracking_id, recipient_email, subject, delivery_status);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_seq_status
  ON public.sequence_enrollments (sequence_id, status)
  INCLUDE (contact_email, current_step, updated_at);

CREATE INDEX IF NOT EXISTS idx_link_click_events_link_created
  ON public.link_click_events (link_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_unread
  ON public.notification_history (user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user_pending
  ON public.follow_up_reminders (user_id, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_scheduled
  ON public.scheduled_emails (user_id, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_contact_scores_user_score
  ON public.contact_scores (user_id, engagement_score DESC);

CREATE OR REPLACE FUNCTION public.admin_index_usage()
RETURNS TABLE(
  schemaname text,
  tablename text,
  indexname text,
  idx_scan bigint,
  idx_tup_read bigint,
  idx_tup_fetch bigint,
  index_size text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT s.schemaname::text, s.relname::text, s.indexrelname::text,
         s.idx_scan, s.idx_tup_read, s.idx_tup_fetch,
         pg_size_pretty(pg_relation_size(s.indexrelid))
  FROM pg_stat_user_indexes s
  WHERE s.schemaname = 'public'
  ORDER BY s.idx_scan ASC, pg_relation_size(s.indexrelid) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_index_usage() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_index_usage() TO authenticated;

ANALYZE public.tracked_emails;
ANALYZE public.sequence_enrollments;
ANALYZE public.link_click_events;
ANALYZE public.notification_history;
ANALYZE public.follow_up_reminders;
ANALYZE public.scheduled_emails;
ANALYZE public.contact_scores;