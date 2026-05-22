-- SECURITY: Fix Function Search Paths for security definer functions
ALTER FUNCTION public.cleanup_expired_challenges() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_login_lockout(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_sequence_completed(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_password_reset_token(uuid, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_login_attempt(text, text, boolean, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.use_password_reset_token(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_email_token(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_due_reminders() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.manage_email_verification_token(uuid, text, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_failed_login(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_lockout_status(text, text) SET search_path = public, pg_temp;

-- SECURITY: Revoke public execution from sensitive RPCs
REVOKE EXECUTE ON FUNCTION public.record_failed_login(text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_lockout_status(text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.reset_login_lockout(text) FROM public;

-- Only authenticated users should call these
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_lockout_status(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_login_lockout(text) TO authenticated;

-- PERFORMANCE: Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_created ON public.tracked_emails (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_id_type ON public.tracking_events (tracking_id, event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON public.tracking_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_links_tracking_id ON public.tracked_links (tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns (user_id);
CREATE INDEX IF NOT EXISTS idx_bounce_alerts_user_resolved ON public.bounce_alerts (user_id, is_resolved);

-- SECURITY: RLS Cleanup & Hardening
-- Ensure RLS is enabled on all tables
DO $$ 
DECLARE 
    t record;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- Data Integrity: Timestamp triggers for all tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger where columns exist
DO $$ 
DECLARE 
    t record;
BEGIN
    FOR t IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'updated_at'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t.table_name);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t.table_name);
    END LOOP;
END $$;
