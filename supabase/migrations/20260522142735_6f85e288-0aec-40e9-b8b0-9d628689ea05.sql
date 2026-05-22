-- 1. SECURITY: Convert views to SECURITY INVOKER (Postgres 15+)
-- This ensures views respect the RLS of underlying tables even when called by high-privilege roles
ALTER VIEW public.v_tracking_summary SET (security_invoker = on);

-- 2. PERFORMANCE: Add missing critical indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id ON public.tracking_events (tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracked_links_tracking_id_link_id ON public.tracked_links (tracking_id, link_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_bounce_alerts_user_id_is_resolved ON public.bounce_alerts (user_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_campaign_id ON public.tracked_emails (campaign_id) WHERE campaign_id IS NOT NULL;

-- 3. SECURITY: Harden SECURITY DEFINER functions with search_path
-- This prevents search path hijacking attacks
ALTER FUNCTION public.cleanup_expired_challenges() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_login_lockout(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_sequence_completed(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_contact_score(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_country_allowed(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_password_reset_token(uuid, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_login_attempt(text, text, boolean, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.use_password_reset_token(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_email_token(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_due_reminders() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_ip_whitelisted(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_permissions(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_ip_blocked(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_lockout_status(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.refresh_email_stats_mv() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_geo_stats(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_bounce_alerts(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_tracking_stats(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_domain_deliverability(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.manage_email_verification_token(uuid, text, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.recalculate_all_contact_scores(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_login_attempts(text, text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_webauthn_challenge(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_failed_login(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_lockout_status(text, text) SET search_path = public, pg_temp;

-- 4. PERFORMANCE: Optimize tracking_events policies
-- Using a join-free approach for common checks
DROP POLICY IF EXISTS "Allow public insert on tracking_events" ON public.tracking_events;
CREATE POLICY "Allow public insert on tracking_events" ON public.tracking_events
FOR INSERT WITH CHECK (
    tracking_id IS NOT NULL AND 
    tracking_id <> '' AND
    EXISTS (SELECT 1 FROM tracked_emails WHERE tracking_id = tracking_events.tracking_id)
);

-- 5. DATA INTEGRITY: User Preferences Initialization Trigger
-- Ensures new users always have a row in user_preferences
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Check if trigger exists before creating
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_prefs') THEN
        CREATE TRIGGER on_auth_user_created_prefs
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();
    END IF;
END $$;
