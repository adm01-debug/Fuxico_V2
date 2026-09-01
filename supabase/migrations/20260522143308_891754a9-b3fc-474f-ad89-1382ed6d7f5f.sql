-- SECURITY: Fix Function Search Paths for security definer functions
-- This is a standard security practice to prevent search path hijacking

ALTER FUNCTION public.cleanup_expired_challenges() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_contact_score(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_login_lockout(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_sequence_completed(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_country_allowed(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_password_reset_token(uuid, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_login_attempt(text, text, boolean, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_email_token(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.use_password_reset_token(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_due_reminders() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_ip_whitelisted(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_permissions(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_ip_blocked(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_lockout_status(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.refresh_email_stats_mv() SET search_path = public, pg_temp;
ALTER FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.manage_email_verification_token(uuid, text, text, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_geo_stats(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_bounce_alerts(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_domain_deliverability(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_tracking_stats(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user_preferences() SET search_path = public, pg_temp;
ALTER FUNCTION public.recalculate_all_contact_scores(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_emails_with_stats(uuid, integer, integer, text, text, timestamp with time zone, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_login_attempts(text, text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_sequence_on_email_event() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_emails_with_stats(uuid, integer, uuid, timestamp with time zone, text, text, timestamp with time zone, timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_webauthn_challenge(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_failed_login(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_lockout_status(text, text) SET search_path = public, pg_temp;

-- Revoke execute from public for sensitive security definer functions where not needed
-- Note: Many of these are already granted correctly, but it's good to be explicit.
REVOKE EXECUTE ON FUNCTION public.record_failed_login(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_lockout_status(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_lockout_status(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.reset_login_lockout(text) FROM public;
GRANT EXECUTE ON FUNCTION public.reset_login_lockout(text) TO authenticated, service_role;
