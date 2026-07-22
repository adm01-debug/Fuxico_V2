CREATE OR REPLACE FUNCTION public.admin_find_orphan_pii()
RETURNS TABLE(source_table text, orphan_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT 'tracked_emails'::text,
         (SELECT count(*) FROM public.tracked_emails t
           LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL);
  RETURN QUERY
  SELECT 'contact_scores'::text,
         (SELECT count(*) FROM public.contact_scores t
           LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL);
  RETURN QUERY
  SELECT 'sequence_enrollments'::text,
         (SELECT count(*) FROM public.sequence_enrollments t
           LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL);
  RETURN QUERY
  SELECT 'user_preferences'::text,
         (SELECT count(*) FROM public.user_preferences t
           LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL);
  RETURN QUERY
  SELECT 'mfa_settings'::text,
         (SELECT count(*) FROM public.mfa_settings t
           LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_find_orphan_pii() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_find_orphan_pii() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_report_orphan_pii()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_details jsonb;
  v_total bigint := 0;
BEGIN
  SELECT jsonb_agg(row_to_json(r)), COALESCE(SUM(r.orphan_count), 0)
    INTO v_details, v_total
    FROM (
      SELECT 'tracked_emails' AS source_table,
             (SELECT count(*) FROM public.tracked_emails t
                LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL) AS orphan_count
      UNION ALL
      SELECT 'contact_scores',
             (SELECT count(*) FROM public.contact_scores t
                LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL)
      UNION ALL
      SELECT 'sequence_enrollments',
             (SELECT count(*) FROM public.sequence_enrollments t
                LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL)
      UNION ALL
      SELECT 'user_preferences',
             (SELECT count(*) FROM public.user_preferences t
                LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL)
      UNION ALL
      SELECT 'mfa_settings',
             (SELECT count(*) FROM public.mfa_settings t
                LEFT JOIN auth.users u ON u.id = t.user_id WHERE u.id IS NULL)
    ) r;

  IF v_total > 0 THEN
    INSERT INTO public.security_events (event_type, severity, description, metadata)
    VALUES ('lgpd_orphan_pii_detected', 'high',
            format('%s registros órfãos de PII detectados', v_total),
            jsonb_build_object('breakdown', v_details, 'total', v_total));
  END IF;

  RETURN jsonb_build_object('ran_at', now(), 'total', v_total, 'breakdown', v_details);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_report_orphan_pii() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_report_orphan_pii() TO service_role;