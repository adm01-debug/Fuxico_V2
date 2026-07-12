
-- Onda 41: Drop de índices ociosos e duplicados (bloat cleanup)
DROP INDEX IF EXISTS public.idx_bounce_alerts_user_id_is_resolved;
DROP INDEX IF EXISTS public.idx_bounce_alerts_user_resolved;
DROP INDEX IF EXISTS public.idx_scheduled_emails_user_id;
DROP INDEX IF EXISTS public.idx_scheduled_emails_pending_by_user;
DROP INDEX IF EXISTS public.idx_notification_history_unread;
DROP INDEX IF EXISTS public.idx_document_events_created_brin;
DROP INDEX IF EXISTS public.idx_link_click_events_created_brin;
DROP INDEX IF EXISTS public.idx_tracked_emails_recipient_trgm;
DROP INDEX IF EXISTS public.idx_tracked_emails_sender_trgm;
DROP INDEX IF EXISTS public.idx_tracked_emails_subject_trgm;
DROP INDEX IF EXISTS public.idx_contact_scores_email_trgm;
DROP INDEX IF EXISTS public.idx_email_stats_mv_recipient_trgm;
DROP INDEX IF EXISTS public.idx_email_stats_mv_subject_trgm;
