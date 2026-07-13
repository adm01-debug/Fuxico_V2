
-- Wave 66: Least-privilege for SECURITY DEFINER functions
-- Revoke EXECUTE from authenticated/anon on all public SECURITY DEFINER functions,
-- then re-grant only to a curated whitelist of functions the frontend actually calls via supabase.rpc().
DO $$
DECLARE
  r record;
  whitelist text[] := ARRAY[
    'has_role',
    'has_permission',
    'get_user_permissions',
    'check_lockout_status',
    'record_failed_login',
    'reset_login_lockout',
    'log_security_event',
    'log_audit_event',
    'get_emails_with_stats',
    'get_user_tracking_stats',
    'get_tracking_monthly_stats',
    'get_geo_stats',
    'refresh_email_stats_mv',
    'calculate_domain_deliverability',
    'get_due_reminders',
    'recalculate_all_contact_scores',
    'update_contact_score',
    'increment_sequence_enrolled',
    'increment_sequence_completed',
    'check_bounce_alerts'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public'
      AND d.objid IS NULL
      AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', r.proname, r.args);
    IF r.proname = ANY(whitelist) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', r.proname, r.args);
    END IF;
    -- service_role always retains EXECUTE (edge functions / admin-rpc proxy)
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', r.proname, r.args);
  END LOOP;
END $$;
