
DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'create_password_reset_token(uuid, text, timestamp with time zone)',
    'use_password_reset_token(text)',
    'verify_email_token(text)',
    'manage_email_verification_token(uuid, text, text, timestamp with time zone)',
    'create_webauthn_challenge(uuid, text, text, text, timestamp with time zone)',
    'verify_webauthn_challenge(text)',
    'cleanup_expired_challenges()',
    'record_failed_login(text, text)',
    'record_login_attempt(text, text, boolean, text, jsonb)',
    'reset_login_lockout(text)',
    'check_login_attempts(text, text, integer, integer)',
    'check_lockout_status(text, text)',
    'get_lockout_status(text)',
    'log_audit_event(uuid, text, text, text, jsonb)',
    'log_security_event(uuid, text, text, text, text, text, jsonb)',
    'run_retention_cleanup()',
    'run_tracking_events_retention()',
    'refresh_email_stats_mv()',
    'create_bounce_alert(uuid, text, numeric, numeric, text)',
    'update_contact_score(uuid, text)',
    'recalculate_all_contact_scores(uuid)',
    'increment_sequence_completed(uuid)',
    'update_sequence_on_email_event()',
    'handle_new_user_preferences()',
    'is_ip_blocked(text)',
    'is_ip_whitelisted(text)',
    'is_country_allowed(text)'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Skip missing function: %', fn;
    END;
  END LOOP;
END$$;
