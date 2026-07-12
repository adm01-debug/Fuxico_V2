-- Email format validation (RFC 5322 simplificado)
ALTER TABLE public.tracked_emails
  DROP CONSTRAINT IF EXISTS tracked_emails_recipient_email_format,
  ADD CONSTRAINT tracked_emails_recipient_email_format
  CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') NOT VALID;

ALTER TABLE public.tracked_emails
  DROP CONSTRAINT IF EXISTS tracked_emails_sender_email_format,
  ADD CONSTRAINT tracked_emails_sender_email_format
  CHECK (sender_email IS NULL OR sender_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') NOT VALID;

-- Delivery status domain
ALTER TABLE public.tracked_emails
  DROP CONSTRAINT IF EXISTS tracked_emails_delivery_status_valid,
  ADD CONSTRAINT tracked_emails_delivery_status_valid
  CHECK (delivery_status IS NULL OR delivery_status IN ('sent','delivered','opened','clicked','bounced','failed','pending','rejected')) NOT VALID;

-- Sequence enrollment status
ALTER TABLE public.sequence_enrollments
  DROP CONSTRAINT IF EXISTS sequence_enrollments_status_valid,
  ADD CONSTRAINT sequence_enrollments_status_valid
  CHECK (status IN ('active','paused','completed','cancelled','failed')) NOT VALID;

ALTER TABLE public.sequence_enrollments
  DROP CONSTRAINT IF EXISTS sequence_enrollments_current_step_nonneg,
  ADD CONSTRAINT sequence_enrollments_current_step_nonneg
  CHECK (current_step >= 0) NOT VALID;

-- Scheduled emails status
ALTER TABLE public.scheduled_emails
  DROP CONSTRAINT IF EXISTS scheduled_emails_status_valid,
  ADD CONSTRAINT scheduled_emails_status_valid
  CHECK (status IN ('pending','sent','failed','cancelled')) NOT VALID;

-- Campaigns status
ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_status_valid,
  ADD CONSTRAINT campaigns_status_valid
  CHECK (status IN ('draft','active','paused','completed','archived','cancelled')) NOT VALID;

-- Follow-up reminders status
ALTER TABLE public.follow_up_reminders
  DROP CONSTRAINT IF EXISTS follow_up_reminders_status_valid,
  ADD CONSTRAINT follow_up_reminders_status_valid
  CHECK (status IN ('pending','sent','cancelled','snoozed')) NOT VALID;

-- Engagement score range
ALTER TABLE public.contact_scores
  DROP CONSTRAINT IF EXISTS contact_scores_engagement_range,
  ADD CONSTRAINT contact_scores_engagement_range
  CHECK (engagement_score >= 0 AND engagement_score <= 100) NOT VALID;

-- Validate all in background (skips rows that violate to surface via check function)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname, conrelid::regclass AS tbl
    FROM pg_constraint
    WHERE NOT convalidated
      AND conrelid::regclass::text LIKE 'public.%'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', r.tbl, r.conname);
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE 'Constraint % on % has violating rows — kept NOT VALID', r.conname, r.tbl;
    END;
  END LOOP;
END$$;

-- Consolidated integrity check function (admin-only)
CREATE OR REPLACE FUNCTION public.admin_data_integrity_check()
RETURNS TABLE(check_name text, violations bigint, severity text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT 'tracked_emails.invalid_recipient'::text,
         COUNT(*)::bigint,
         'high'::text
  FROM public.tracked_emails
  WHERE recipient_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

  RETURN QUERY
  SELECT 'tracked_emails.orphan_user'::text,
         COUNT(*)::bigint,
         'critical'::text
  FROM public.tracked_emails te
  LEFT JOIN auth.users u ON u.id = te.user_id
  WHERE u.id IS NULL;

  RETURN QUERY
  SELECT 'sequence_enrollments.orphan_sequence'::text,
         COUNT(*)::bigint,
         'high'::text
  FROM public.sequence_enrollments se
  LEFT JOIN public.email_sequences es ON es.id = se.sequence_id
  WHERE es.id IS NULL;

  RETURN QUERY
  SELECT 'tracking_events.default_partition_rows'::text,
         COUNT(*)::bigint,
         'medium'::text
  FROM public.tracking_events_default;

  RETURN QUERY
  SELECT 'contact_scores.out_of_range'::text,
         COUNT(*)::bigint,
         'medium'::text
  FROM public.contact_scores
  WHERE engagement_score < 0 OR engagement_score > 100;

  RETURN QUERY
  SELECT 'scheduled_emails.stuck_pending'::text,
         COUNT(*)::bigint,
         'low'::text
  FROM public.scheduled_emails
  WHERE status = 'pending' AND scheduled_at < now() - interval '1 hour';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_data_integrity_check() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_data_integrity_check() TO authenticated;