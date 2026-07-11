
-- Round 2 hardening: revoke EXECUTE on public SECURITY DEFINER functions from
-- authenticated/anon/PUBLIC, then re-grant only the RPCs the frontend actually
-- calls. All other functions are used exclusively by edge functions running as
-- service_role (which bypasses GRANTs) or by triggers (owner-context).

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.proname, r.args);
  END LOOP;
END $$;

-- Re-grant only frontend-callable RPCs to authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tracking_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, integer, text, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, uuid, timestamptz, text, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_geo_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lockout_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_lockout_status(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_login_lockout(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_contact_scores(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contact_score(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_bounce_alerts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_domain_deliverability(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_email_stats_mv() TO authenticated;
