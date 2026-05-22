-- Revoke public execution from sensitive security definer functions
-- Only authenticated users or service_role should call these

-- Stats and Summary
REVOKE EXECUTE ON FUNCTION public.refresh_email_stats_mv() FROM public;
GRANT EXECUTE ON FUNCTION public.refresh_email_stats_mv() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_tracking_stats(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_tracking_stats(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, integer, text, text, timestamp with time zone, timestamp with time zone) FROM public;
GRANT EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, integer, text, text, timestamp with time zone, timestamp with time zone) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, uuid, timestamp with time zone, text, text, timestamp with time zone, timestamp with time zone) FROM public;
GRANT EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, uuid, timestamp with time zone, text, text, timestamp with time zone, timestamp with time zone) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_geo_stats(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_geo_stats(uuid) TO authenticated, service_role;

-- Security and Management
REVOKE EXECUTE ON FUNCTION public.record_failed_login(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_lockout_status(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_lockout_status(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.reset_login_lockout(text) FROM public;
GRANT EXECUTE ON FUNCTION public.reset_login_lockout(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_challenges() FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_challenges() TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_permissions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- Notifications and Bounces
REVOKE EXECUTE ON FUNCTION public.check_bounce_alerts(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.check_bounce_alerts(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) TO service_role;
