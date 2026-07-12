
-- Guard: only allow calling with the caller's own user_id
CREATE OR REPLACE FUNCTION public.get_user_tracking_stats(p_user_id uuid)
RETURNS TABLE(total_emails bigint, total_opens bigint, total_clicks bigint, total_bounces bigint, open_rate numeric, click_rate numeric, bounce_rate numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT COUNT(*)::BIGINT, SUM(esm.open_count)::BIGINT, SUM(esm.click_count)::BIGINT,
         COUNT(*) FILTER (WHERE esm.delivery_status = 'bounced')::BIGINT,
         CASE WHEN COUNT(*)>0 THEN ROUND((COUNT(*) FILTER (WHERE esm.open_count>0)::NUMERIC/COUNT(*))*100,2) ELSE 0 END,
         CASE WHEN COUNT(*)>0 THEN ROUND((COUNT(*) FILTER (WHERE esm.click_count>0)::NUMERIC/COUNT(*))*100,2) ELSE 0 END,
         CASE WHEN COUNT(*)>0 THEN ROUND((COUNT(*) FILTER (WHERE esm.delivery_status='bounced')::NUMERIC/COUNT(*))*100,2) ELSE 0 END
  FROM email_stats_mv esm WHERE esm.user_id = p_user_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_geo_stats(p_user_id uuid)
RETURNS TABLE(country text, city text, open_count bigint, click_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT COALESCE(te.metadata->>'country','Unknown')::TEXT,
         COALESCE(te.metadata->>'city','Unknown')::TEXT,
         COUNT(*) FILTER (WHERE te.event_type='open')::BIGINT,
         COUNT(*) FILTER (WHERE te.event_type='click')::BIGINT
  FROM tracking_events te
  INNER JOIN tracked_emails em ON te.tracking_id=em.tracking_id
  WHERE em.user_id=p_user_id AND te.metadata IS NOT NULL AND te.metadata->>'country' IS NOT NULL
  GROUP BY COALESCE(te.metadata->>'country','Unknown'), COALESCE(te.metadata->>'city','Unknown')
  ORDER BY COUNT(*) DESC LIMIT 100;
END; $function$;

CREATE OR REPLACE FUNCTION public.calculate_domain_deliverability(p_user_id uuid)
RETURNS TABLE(domain text, total_sent bigint, total_delivered bigint, total_bounced bigint, total_opened bigint, bounce_rate numeric, open_rate numeric, delivery_rate numeric, reputation_score integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH domain_stats AS (
    SELECT LOWER(SPLIT_PART(te.sender_email,'@',2)) AS sender_domain,
      COUNT(*)::bigint AS sent,
      COUNT(*) FILTER (WHERE te.delivery_status='delivered' OR te.delivery_status='sent')::bigint AS delivered,
      COUNT(*) FILTER (WHERE te.delivery_status='bounced')::bigint AS bounced,
      COALESCE(SUM(esm.open_count),0)::bigint AS opened
    FROM tracked_emails te
    LEFT JOIN email_stats_mv esm ON te.tracking_id=esm.tracking_id
    WHERE te.user_id=p_user_id AND te.sender_email IS NOT NULL
    GROUP BY LOWER(SPLIT_PART(te.sender_email,'@',2))
  )
  SELECT ds.sender_domain, ds.sent, ds.delivered, ds.bounced, ds.opened,
    CASE WHEN ds.sent>0 THEN ROUND((ds.bounced::numeric/ds.sent)*100,2) ELSE 0 END,
    CASE WHEN ds.delivered>0 THEN ROUND((ds.opened::numeric/ds.delivered)*100,2) ELSE 0 END,
    CASE WHEN ds.sent>0 THEN ROUND((ds.delivered::numeric/ds.sent)*100,2) ELSE 0 END,
    CASE WHEN ds.sent=0 THEN 50 ELSE GREATEST(0, LEAST(100,
      50 + (CASE WHEN ds.sent>0 THEN ((ds.delivered::numeric/ds.sent)*25) ELSE 0 END)
         + (CASE WHEN ds.delivered>0 THEN ((ds.opened::numeric/ds.delivered)*15) ELSE 0 END)
         - (CASE WHEN ds.sent>0 THEN ((ds.bounced::numeric/ds.sent)*40) ELSE 0 END)
    ))::integer END
  FROM domain_stats ds WHERE ds.sender_domain IS NOT NULL AND ds.sender_domain<>''
  ORDER BY ds.sent DESC;
END; $function$;

CREATE OR REPLACE FUNCTION public.check_bounce_alerts(p_user_id uuid)
RETURNS TABLE(domain text, bounce_rate numeric, threshold numeric, severity text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_warning NUMERIC := 5.0; v_critical NUMERIC := 10.0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT at.bounce_rate_warning, at.bounce_rate_critical INTO v_warning, v_critical
  FROM alert_thresholds at WHERE at.user_id=p_user_id;
  RETURN QUERY
  SELECT dr.domain, dr.bounce_rate,
    CASE WHEN dr.bounce_rate >= v_critical THEN v_critical ELSE v_warning END,
    CASE WHEN dr.bounce_rate >= v_critical THEN 'critical' ELSE 'warning' END
  FROM domain_reputation dr
  WHERE dr.user_id=p_user_id AND dr.bounce_rate >= v_warning;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(permission_key text, permission_name text, category text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT DISTINCT p.permission_key, p.name, p.category
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role=rp.role
  JOIN public.permissions p ON rp.permission_id=p.id
  WHERE ur.user_id=_user_id
  ORDER BY p.category, p.name;
END; $function$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role=rp.role
    JOIN public.permissions p ON rp.permission_id=p.id
    WHERE ur.user_id=_user_id AND p.permission_key=_permission_key
  );
END; $function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role
  );
END; $function$;

-- Guard both get_emails_with_stats overloads
CREATE OR REPLACE FUNCTION public.get_emails_with_stats(
  p_user_id uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL, p_search text DEFAULT NULL,
  p_start_date timestamp with time zone DEFAULT NULL, p_end_date timestamp with time zone DEFAULT NULL
) RETURNS TABLE(id uuid, tracking_id text, recipient_email text, sender_email text, subject text, created_at timestamp with time zone, user_id uuid, delivery_status text, bounce_type text, bounce_reason text, bounce_detected_at timestamp with time zone, metadata jsonb, open_count bigint, click_count bigint, unique_opens bigint, first_opened_at timestamp with time zone, last_opened_at timestamp with time zone, total_link_clicks bigint, unique_links_clicked bigint, total_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_total_count BIGINT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT COUNT(*) INTO v_total_count FROM email_stats_mv esm
  WHERE esm.user_id=p_user_id
    AND (p_status IS NULL OR esm.delivery_status=p_status)
    AND (p_search IS NULL OR esm.recipient_email ILIKE '%'||p_search||'%' OR esm.subject ILIKE '%'||p_search||'%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date);
  RETURN QUERY
  SELECT esm.id, esm.tracking_id, esm.recipient_email, esm.sender_email, esm.subject, esm.created_at,
         esm.user_id, esm.delivery_status, esm.bounce_type, esm.bounce_reason, esm.bounce_detected_at,
         esm.metadata, esm.open_count, esm.click_count, esm.unique_opens, esm.first_opened_at, esm.last_opened_at,
         esm.total_link_clicks, esm.unique_links_clicked, v_total_count
  FROM email_stats_mv esm
  WHERE esm.user_id=p_user_id
    AND (p_status IS NULL OR esm.delivery_status=p_status)
    AND (p_search IS NULL OR esm.recipient_email ILIKE '%'||p_search||'%' OR esm.subject ILIKE '%'||p_search||'%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date)
  ORDER BY esm.created_at DESC LIMIT p_limit OFFSET p_offset;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_emails_with_stats(
  p_user_id uuid, p_limit integer DEFAULT 100,
  p_last_id uuid DEFAULT NULL, p_last_timestamp timestamp with time zone DEFAULT NULL,
  p_status text DEFAULT NULL, p_search text DEFAULT NULL,
  p_start_date timestamp with time zone DEFAULT NULL, p_end_date timestamp with time zone DEFAULT NULL
) RETURNS TABLE(id uuid, tracking_id text, recipient_email text, sender_email text, subject text, created_at timestamp with time zone, user_id uuid, delivery_status text, bounce_type text, bounce_reason text, bounce_detected_at timestamp with time zone, metadata jsonb, open_count bigint, click_count bigint, unique_opens bigint, first_opened_at timestamp with time zone, last_opened_at timestamp with time zone, total_link_clicks bigint, unique_links_clicked bigint, total_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_total_count BIGINT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT COUNT(*) INTO v_total_count FROM email_stats_mv esm
  WHERE esm.user_id=p_user_id
    AND (p_status IS NULL OR esm.delivery_status=p_status)
    AND (p_search IS NULL OR esm.recipient_email ILIKE '%'||p_search||'%' OR esm.subject ILIKE '%'||p_search||'%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date);
  RETURN QUERY
  SELECT esm.id, esm.tracking_id, esm.recipient_email, esm.sender_email, esm.subject, esm.created_at,
         esm.user_id, esm.delivery_status, esm.bounce_type, esm.bounce_reason, esm.bounce_detected_at,
         esm.metadata, esm.open_count, esm.click_count, esm.unique_opens, esm.first_opened_at, esm.last_opened_at,
         esm.total_link_clicks, esm.unique_links_clicked, v_total_count
  FROM email_stats_mv esm
  WHERE esm.user_id=p_user_id
    AND (p_status IS NULL OR esm.delivery_status=p_status)
    AND (p_search IS NULL OR esm.recipient_email ILIKE '%'||p_search||'%' OR esm.subject ILIKE '%'||p_search||'%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date)
    AND (p_last_timestamp IS NULL OR (esm.created_at < p_last_timestamp) OR (esm.created_at = p_last_timestamp AND esm.id < p_last_id))
  ORDER BY esm.created_at DESC, esm.id DESC LIMIT p_limit;
END; $function$;

-- get_due_reminders is only called by cron/service_role
REVOKE EXECUTE ON FUNCTION public.get_due_reminders() FROM PUBLIC, anon, authenticated;
