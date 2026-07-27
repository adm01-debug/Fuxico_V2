-- =====================================================================
-- Onda 140 — Hardening de SECURITY DEFINER expostas a authenticated/anon
-- =====================================================================

-- F-01 (CRÍTICO): admin_system_health_score() era SECURITY DEFINER sem
-- qualquer verificação de papel, executável por todo authenticated.
CREATE OR REPLACE FUNCTION public.admin_system_health_score()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_inner jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_service_context()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT public.admin_system_health_score_impl() INTO v_inner;
  RETURN v_inner;
END;
$function$;

-- Corpo original preservado em função interna, restrita a service_role.
CREATE OR REPLACE FUNCTION public.admin_system_health_score_impl()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_score numeric := 10.0;
  v_breakdown jsonb := '{}'::jsonb;
  v_val int;
  v_pool jsonb;
  v_key jsonb;
  v_grade text;
BEGIN
  SELECT count(*)::int INTO v_val
  FROM public.cron_job_failures
  WHERE created_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('cron_failures_24h', v_val);
  v_score := v_score - least(v_val * 0.5, 2);

  SELECT count(*)::int INTO v_val
  FROM public.cron_job_failures
  WHERE created_at >= now() - interval '7 days';
  v_breakdown := v_breakdown || jsonb_build_object('cron_failures_7d', v_val);
  v_score := v_score - least(v_val * 0.1, 1);

  SELECT count(*)::int INTO v_val
  FROM public.security_events
  WHERE severity IN ('critical','high') AND created_at >= now() - interval '24 hours';
  v_breakdown := v_breakdown || jsonb_build_object('critical_events_24h', v_val);
  v_score := v_score - least(v_val * 0.25, 2);

  SELECT count(*)::int INTO v_val
  FROM public.webhook_circuit_state WHERE state = 'open';
  v_breakdown := v_breakdown || jsonb_build_object('open_circuits', v_val);
  v_score := v_score - least(v_val * 0.5, 1.5);

  SELECT count(*)::int INTO v_val
  FROM public.webhook_retry_queue WHERE status = 'pending';
  v_breakdown := v_breakdown || jsonb_build_object('pending_retries', v_val);
  v_score := v_score - least(v_val * 0.01, 1);

  BEGIN
    v_pool := public.admin_pool_stats();
  EXCEPTION WHEN OTHERS THEN
    v_pool := '{}'::jsonb;
  END;
  v_breakdown := v_breakdown || jsonb_build_object('pool', v_pool);

  BEGIN
    v_key := public.admin_signing_key_status();
  EXCEPTION WHEN OTHERS THEN
    v_key := '{}'::jsonb;
  END;
  v_breakdown := v_breakdown || jsonb_build_object('signing_key', v_key);

  v_score := greatest(round(v_score, 2), 0);
  v_grade := CASE
    WHEN v_score >= 9.5 THEN 'A+'
    WHEN v_score >= 9.0 THEN 'A'
    WHEN v_score >= 8.0 THEN 'B'
    WHEN v_score >= 7.0 THEN 'C'
    WHEN v_score >= 6.0 THEN 'D'
    ELSE 'F'
  END;

  RETURN jsonb_build_object(
    'score', v_score,
    'grade', v_grade,
    'breakdown', v_breakdown,
    'captured_at', now()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_system_health_score_impl() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_system_health_score_impl() TO service_role;

REVOKE ALL ON FUNCTION public.admin_system_health_score() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_system_health_score() TO authenticated, service_role;

-- F-02: rotinas admin_* consumidas exclusivamente pelo proxy admin-rpc
-- (service_role). Defesa em profundidade: authenticated não precisa delas.
REVOKE ALL ON FUNCTION public.admin_index_advisor(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_run_index_advisor() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_list_index_advisor_runs(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_cleanup_index_advisor_runs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_last_index_advisor_cleanup() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_webhook_circuit_dashboard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_reset_webhook_circuit(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_index_advisor(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_run_index_advisor() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_index_advisor_runs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_cleanup_index_advisor_runs() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_last_index_advisor_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_webhook_circuit_dashboard() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_reset_webhook_circuit(uuid) TO service_role;

-- =====================================================================
-- F-03 (REGRESSÃO FUNCIONAL): o fluxo de lockout de login roda ANTES da
-- autenticação (role anon). A Onda 133 revogou anon, quebrando silenciosamente
-- a proteção contra brute force. Restaurado com normalização + validação.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.check_lockout_status(_email text, _ip_address text DEFAULT NULL::text)
RETURNS TABLE(is_locked boolean, lockout_remaining_seconds integer, failed_attempts integer, lockout_until timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lockout RECORD;
  v_email text := lower(btrim(coalesce(_email, '')));
BEGIN
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(v_email) > 320 THEN
    RETURN QUERY SELECT false, 0, 0, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  SELECT ll.failed_attempts, ll.lockout_until
  INTO v_lockout
  FROM login_lockouts ll
  WHERE ll.email = v_email;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  IF v_lockout.lockout_until IS NOT NULL AND v_lockout.lockout_until > now() THEN
    RETURN QUERY SELECT
      true,
      EXTRACT(EPOCH FROM (v_lockout.lockout_until - now()))::INTEGER,
      v_lockout.failed_attempts,
      v_lockout.lockout_until;
  ELSE
    RETURN QUERY SELECT false, 0, v_lockout.failed_attempts, v_lockout.lockout_until;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_failed_login(_email text, _ip_address text DEFAULT NULL::text)
RETURNS TABLE(is_now_locked boolean, lockout_seconds integer, total_attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attempts INTEGER;
  v_lockout_seconds INTEGER;
  v_lockout_until TIMESTAMP WITH TIME ZONE;
  v_max_attempts INTEGER := 5;
  v_email text := lower(btrim(coalesce(_email, '')));
BEGIN
  -- Entrada inválida nunca cria linha de lockout (evita poluição da tabela).
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(v_email) > 320 THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  INSERT INTO login_lockouts (email, ip_address, failed_attempts, last_failed_at)
  VALUES (v_email, _ip_address, 1, now())
  ON CONFLICT (email) DO UPDATE SET
    failed_attempts = login_lockouts.failed_attempts + 1,
    last_failed_at = now(),
    ip_address = COALESCE(_ip_address, login_lockouts.ip_address),
    updated_at = now()
  RETURNING failed_attempts INTO v_attempts;

  IF v_attempts >= v_max_attempts THEN
    v_lockout_seconds := 30 * POWER(2, LEAST(v_attempts - v_max_attempts, 10));
    v_lockout_until := now() + (v_lockout_seconds || ' seconds')::INTERVAL;

    UPDATE login_lockouts SET lockout_until = v_lockout_until WHERE email = v_email;

    INSERT INTO security_events (event_type, severity, description, ip_address, metadata)
    VALUES (
      'account_lockout',
      'warning',
      'Account temporarily locked after ' || v_attempts || ' failed login attempts',
      _ip_address,
      jsonb_build_object(
        'email_hash', encode(digest(v_email, 'sha256'), 'hex'),
        'attempts', v_attempts,
        'lockout_seconds', v_lockout_seconds
      )
    );

    RETURN QUERY SELECT true, v_lockout_seconds, v_attempts;
  ELSE
    RETURN QUERY SELECT false, 0, v_attempts;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.check_lockout_status(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_failed_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_lockout_status(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text) TO anon, authenticated, service_role;

-- Guarda de conformidade
DO $$
BEGIN
  IF has_function_privilege('authenticated', 'public.admin_webhook_circuit_dashboard()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.admin_system_health_score()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Onda 140: grants administrativos não foram revogados corretamente';
  END IF;
END$$;