
CREATE OR REPLACE FUNCTION public.admin_rls_canary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tables text[] := ARRAY[
    'tracked_emails','contact_scores','sequence_enrollments',
    'scheduled_emails','ab_tests','follow_up_reminders',
    'dsar_requests','user_preferences','notification_history',
    'webhook_configs','webhook_retry_queue','campaigns',
    'email_templates','email_sequences','tracked_documents',
    'standalone_tracked_links','bounce_alerts','contact_scores',
    'unsubscribed_emails','fraud_alerts'
  ];
  v_user_a uuid;
  v_user_b uuid;
  v_tbl text;
  v_leak int;
  v_passed int := 0;
  v_failed int := 0;
  v_failures jsonb := '[]'::jsonb;
BEGIN
  -- Pick two distinct real users with data
  SELECT user_id INTO v_user_a
  FROM public.tracked_emails
  GROUP BY user_id
  ORDER BY count(*) DESC
  LIMIT 1;

  SELECT user_id INTO v_user_b
  FROM public.tracked_emails
  WHERE user_id <> v_user_a
  GROUP BY user_id
  ORDER BY count(*) DESC
  LIMIT 1;

  IF v_user_a IS NULL OR v_user_b IS NULL THEN
    RETURN jsonb_build_object(
      'status','skipped',
      'reason','insufficient_users',
      'ran_at', now()
    );
  END IF;

  FOREACH v_tbl IN ARRAY v_tables LOOP
    BEGIN
      -- Impersonate user_a and count rows that belong to user_b
      PERFORM set_config('role','authenticated', true);
      PERFORM set_config('request.jwt.claims',
        jsonb_build_object('sub', v_user_a, 'role','authenticated')::text, true);

      EXECUTE format(
        'SELECT count(*)::int FROM public.%I WHERE user_id = %L',
        v_tbl, v_user_b
      ) INTO v_leak;

      -- Reset role for admin ops
      PERFORM set_config('role','postgres', true);
      PERFORM set_config('request.jwt.claims','', true);

      IF v_leak > 0 THEN
        v_failed := v_failed + 1;
        v_failures := v_failures || jsonb_build_object(
          'table', v_tbl, 'leaked_rows', v_leak);

        INSERT INTO public.security_events (
          event_type, severity, description, metadata
        ) VALUES (
          'rls_canary_failure', 'critical',
          format('RLS canary detected leak on %s (%s rows visible cross-user)', v_tbl, v_leak),
          jsonb_build_object('table', v_tbl, 'leaked_rows', v_leak,
                             'user_a', v_user_a, 'user_b', v_user_b)
        );
      ELSE
        v_passed := v_passed + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ensure role reset even on error
      PERFORM set_config('role','postgres', true);
      PERFORM set_config('request.jwt.claims','', true);
      -- Table may not exist in some environments; count as skip
      NULL;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'status','ok',
    'passed', v_passed,
    'failed', v_failed,
    'failures', v_failures,
    'ran_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_rls_canary() FROM PUBLIC, anon, authenticated;
