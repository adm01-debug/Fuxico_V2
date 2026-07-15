
-- Onda 79: timeouts em funções client-callable de agregação
DO $$
DECLARE
  fn TEXT;
BEGIN
  FOR fn IN
    SELECT unnest(ARRAY[
      'public.get_user_tracking_stats(uuid)',
      'public.get_tracking_monthly_stats(uuid, integer)',
      'public.check_bounce_alerts(uuid)',
      'public.get_emails_with_stats(uuid, integer, uuid, timestamptz, text, text, timestamptz, timestamptz)'
    ])
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET statement_timeout = ''5s''', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip %', fn;
    END;
  END LOOP;
END $$;

-- Índice parcial: emails com bounce por usuário (dashboard de deliverability)
CREATE INDEX IF NOT EXISTS idx_tracked_emails_bounced
  ON public.tracked_emails (user_id, created_at DESC)
  WHERE delivery_status = 'bounced';

-- Índice de suporte para get_due_reminders (status pending)
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_pending_user
  ON public.follow_up_reminders (user_id, tracking_id)
  WHERE status = 'pending';
