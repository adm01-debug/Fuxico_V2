-- =====================================================================
-- ONDA 134 — Authorization hardening (IDOR) em SECURITY DEFINER RPCs
-- =====================================================================

-- 1) Helper: detecta contexto de serviço (edge functions / cron / owner)
CREATE OR REPLACE FUNCTION public.is_service_context()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
           NULLIF(current_setting('request.jwt.claim.role', true), ''),
           NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), ''),
           ''
         ) = 'service_role'
      OR current_user IN ('postgres', 'supabase_admin', 'service_role');
$function$;

REVOKE ALL ON FUNCTION public.is_service_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_service_context() TO authenticated, service_role;

-- 2) update_contact_score: exige propriedade do user_id
CREATE OR REPLACE FUNCTION public.update_contact_score(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_emails INTEGER;
  v_total_opens INTEGER;
  v_total_clicks INTEGER;
  v_total_bounces INTEGER;
  v_unique_opens INTEGER;
  v_first_interaction TIMESTAMP WITH TIME ZONE;
  v_last_interaction TIMESTAMP WITH TIME ZONE;
  v_score INTEGER;
  v_level TEXT;
BEGIN
  IF NOT public.is_service_context()
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT
    COUNT(*),
    COALESCE(SUM(esm.open_count), 0),
    COALESCE(SUM(esm.click_count), 0),
    COUNT(*) FILTER (WHERE esm.delivery_status = 'bounced'),
    COUNT(*) FILTER (WHERE esm.open_count > 0),
    MIN(esm.created_at),
    MAX(GREATEST(esm.last_opened_at, esm.created_at))
  INTO
    v_total_emails, v_total_opens, v_total_clicks,
    v_total_bounces, v_unique_opens, v_first_interaction, v_last_interaction
  FROM email_stats_mv esm
  WHERE esm.user_id = p_user_id AND esm.recipient_email = p_email;

  v_score := 0;

  IF v_total_emails > 0 THEN
    v_score := v_score + LEAST(40, (v_unique_opens::FLOAT / v_total_emails) * 40);
    v_score := v_score + LEAST(40, (v_total_clicks::FLOAT / GREATEST(v_total_opens, 1)) * 40);
    IF v_last_interaction IS NOT NULL THEN
      v_score := v_score + GREATEST(0, 20 - EXTRACT(DAY FROM (now() - v_last_interaction)));
    END IF;
  END IF;

  v_score := GREATEST(0, v_score - (v_total_bounces * 10));

  v_level := CASE
    WHEN v_score >= 70 THEN 'hot'
    WHEN v_score >= 40 THEN 'warm'
    WHEN v_score >= 20 THEN 'cool'
    ELSE 'cold'
  END;

  INSERT INTO contact_scores (
    user_id, email, total_emails_sent, total_opens, total_clicks,
    total_bounces, unique_opens, first_interaction_at, last_interaction_at,
    engagement_score, score_level
  ) VALUES (
    p_user_id, p_email, v_total_emails, v_total_opens, v_total_clicks,
    v_total_bounces, v_unique_opens, v_first_interaction, v_last_interaction,
    v_score, v_level
  )
  ON CONFLICT (user_id, email) DO UPDATE SET
    total_emails_sent = EXCLUDED.total_emails_sent,
    total_opens = EXCLUDED.total_opens,
    total_clicks = EXCLUDED.total_clicks,
    total_bounces = EXCLUDED.total_bounces,
    unique_opens = EXCLUDED.unique_opens,
    first_interaction_at = EXCLUDED.first_interaction_at,
    last_interaction_at = EXCLUDED.last_interaction_at,
    engagement_score = EXCLUDED.engagement_score,
    score_level = EXCLUDED.score_level,
    updated_at = now();
END;
$function$;

-- 3) recalculate_all_contact_scores: exige propriedade + limite defensivo
CREATE OR REPLACE FUNCTION public.recalculate_all_contact_scores(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email TEXT;
  v_count INTEGER := 0;
BEGIN
  IF NOT public.is_service_context()
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  FOR v_email IN
    SELECT DISTINCT recipient_email FROM tracked_emails WHERE user_id = p_user_id
  LOOP
    PERFORM update_contact_score(p_user_id, v_email);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- 4) promote_ab_winner: exige propriedade do teste A/B
CREATE OR REPLACE FUNCTION public.promote_ab_winner(_test_id uuid, _winner text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  t RECORD;
  v_template_id uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF _winner NOT IN ('A','B') THEN
    RAISE EXCEPTION 'invalid_winner' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_service_context() AND v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO t
  FROM public.ab_tests
  WHERE id = _test_id
    AND winner_promoted_at IS NULL
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_promoted_or_locked');
  END IF;

  IF NOT public.is_service_context() AND t.user_id <> v_caller THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.email_templates (user_id, name, subject, body, category)
  VALUES (
    t.user_id,
    format('A/B Vencedor: %s (Variante %s)', LEFT(t.name, 60), _winner),
    CASE WHEN _winner = 'A' THEN t.variant_a_subject ELSE t.variant_b_subject END,
    COALESCE(CASE WHEN _winner = 'A' THEN t.variant_a_body ELSE t.variant_b_body END, ''),
    'A/B Winners'
  )
  RETURNING id INTO v_template_id;

  UPDATE public.ab_tests
     SET winner = _winner,
         status = 'completed',
         winner_promoted_at = now(),
         completed_at = COALESCE(completed_at, now())
   WHERE id = _test_id;

  INSERT INTO public.notification_history (
    user_id, type, severity, title, message, metadata, is_read
  ) VALUES (
    t.user_id,
    'ab_winner_promoted',
    'success',
    format('Variante %s vencedora promovida', _winner),
    format('O teste A/B "%s" foi concluído. A variante %s foi salva como template.', t.name, _winner),
    jsonb_build_object('ab_test_id', _test_id, 'winner', _winner, 'template_id', v_template_id),
    false
  );

  RETURN jsonb_build_object('ok', true, 'template_id', v_template_id, 'winner', _winner);
END;
$function$;

-- 5) reset_login_lockout: apenas o próprio dono do e-mail ou admin
CREATE OR REPLACE FUNCTION public.reset_login_lockout(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_target text := lower(COALESCE(_email, ''));
BEGIN
  IF v_target = '' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_service_context()
     AND NOT (v_caller IS NOT NULL AND v_caller_email = v_target)
     AND NOT public.has_role(v_caller, 'admin'::app_role) THEN
    INSERT INTO public.security_events (event_type, severity, user_id, metadata)
    VALUES (
      'lockout_reset_denied',
      'high',
      v_caller,
      jsonb_build_object('target_email_hash', encode(digest(v_target, 'sha256'), 'hex'))
    );
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  DELETE FROM login_lockouts WHERE lower(email) = v_target;
END;
$function$;