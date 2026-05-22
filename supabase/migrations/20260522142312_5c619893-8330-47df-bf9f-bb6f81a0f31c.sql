-- 1. Convert views to SECURITY INVOKER (Postgres 15+)
ALTER VIEW public.v_tracking_summary SET (security_invoker = on);

-- 2. Optimize tracking_events SELECT policy
-- Current policy uses EXISTS subquery which can be slow. 
-- For better performance, we keep the index on tracking_id.
-- We can also simplify the INSERT policy.
DROP POLICY IF EXISTS "Allow public insert on tracking_events" ON public.tracking_events;
CREATE POLICY "Allow public insert on tracking_events" ON public.tracking_events
FOR INSERT WITH CHECK (
    tracking_id IS NOT NULL AND 
    tracking_id <> '' AND
    EXISTS (SELECT 1 FROM tracked_emails WHERE tracking_id = tracking_events.tracking_id)
);

-- 3. Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id ON public.tracking_events (tracking_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_campaign_id ON public.tracked_emails (campaign_id) WHERE campaign_id IS NOT NULL;

-- 4. Fix function search paths for remaining security definer functions
-- (Exhaustive list based on previous query)
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

-- 5. Data Integrity: Default User Preferences Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Create trigger on auth.users if possible (usually needs to be done via dashboard or hook)
-- In Lovable Cloud, we use a public profiles table pattern often.
-- If user_preferences exists, we ensure it's populated.
