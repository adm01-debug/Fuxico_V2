
-- 1) get_due_reminders: escopar por auth.uid()
CREATE OR REPLACE FUNCTION public.get_due_reminders()
RETURNS TABLE(id uuid, user_id uuid, tracking_id text, reminder_days integer, recipient_email text, subject text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    fr.id,
    fr.user_id,
    fr.tracking_id,
    fr.reminder_days,
    te.recipient_email,
    te.subject,
    te.created_at
  FROM follow_up_reminders fr
  JOIN tracked_emails te ON fr.tracking_id = te.tracking_id
  LEFT JOIN email_stats_mv esm ON te.tracking_id = esm.tracking_id
  WHERE fr.status = 'pending'
    AND fr.user_id = auth.uid()
    AND (esm.open_count IS NULL OR esm.open_count = 0)
    AND te.created_at + (fr.reminder_days || ' days')::INTERVAL <= now();
END;
$function$;

-- 2) refresh_email_stats_mv: revogar de authenticated/anon, manter só service_role
REVOKE EXECUTE ON FUNCTION public.refresh_email_stats_mv() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_email_stats_mv() TO service_role;
