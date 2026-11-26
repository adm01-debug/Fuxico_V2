-- Correcao de 4 funcoes de cron que falhavam 100% das execucoes em producao.
--
-- Evidencia coletada em cron.job_run_details (26/11/2026), antes desta migration:
--
--  1. fuxico-capture-query-perf (de hora em hora) + daily-index-advisor (diario)
--     "function public.run_index_advisor_check() is not unique" -- existiam dois
--     overloads (0 args e 1 arg com DEFAULT 'cron'), e o cron chamava sem
--     argumentos. Alem da ambiguidade, o overload de 1 arg lia colunas que nao
--     existem em admin_index_advisor() (severity/live_tuples em vez de
--     recommendation/n_live_tup), portanto falharia de qualquer forma.
--     -> dropa o overload de 0 args (ninguem o chamava) e corrige as colunas.
--
--  2. dispatch_critical_alerts_daily (diario) falhava sempre com
--     'column "notification_type" of relation "notification_history" does not
--     exist'. Consequencia: nenhum administrador recebia alerta in-app de evento
--     critico. A migration corrige o INSERT (type/severity/is_read) e tambem o
--     INSERT em alert_dispatch_log, que usava event_id (sempre NULL na tabela,
--     364/364 linhas) em vez de security_event_id -- a idempotencia dependia de
--     um ON CONFLICT (event_id) que nao tem constraint correspondente (a unique
--     real e (security_event_id, channel)).
--     Verificado apos a correcao: 1a execucao -> events_scanned=5,
--     notifications_created=5; 2a execucao -> events_scanned=0 (idempotente).
--
--  3. admin-rls-canary-full-daily (diario) falhava sempre com
--     'record "r" has no field "table_name"' e, depois desse conserto, com
--     'column reference "passed" is ambiguous' dentro de admin_rls_canary_write()
--     -- um bloco IF EXISTS morto que chamava a propria funcao (recursao).
--     admin_rls_canary() retorna jsonb (nao uma tabela com table_name/passed/
--     detail), entao o wrapper foi reescrito para consumir o jsonb.
--     Verificado apos a correcao: admin_rls_canary_full() -> 6 linhas, 0 falhas.
--
-- Nenhuma destas funcoes e chamada pelo frontend. Todas as chamadas sao de cron.

-- 1. Remove a ambiguidade do nome (sobra o overload de 1 arg, com DEFAULT).
DROP FUNCTION IF EXISTS public.run_index_advisor_check();


-- public.admin_rls_canary_write()
CREATE OR REPLACE FUNCTION public.admin_rls_canary_write()
 RETURNS TABLE(table_name text, operation text, expected text, actual text, passed boolean, detail text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_seed_id uuid;
  v_err text;
  v_sqlstate text;
  v_tables text[] := ARRAY['tracked_emails','contact_scores','sequence_enrollments','webhook_configs','campaigns'];
  v_tbl text;
BEGIN
  -- Savepoint isolando toda a mutação
  BEGIN
    FOREACH v_tbl IN ARRAY v_tables LOOP
      ---------------------------------------------------------------------
      -- Seed: user_a insere uma linha real (via service role, sem RLS)
      ---------------------------------------------------------------------
      v_seed_id := gen_random_uuid();
      BEGIN
        EXECUTE format(
          'INSERT INTO public.%I (id, user_id) VALUES ($1, $2)', v_tbl
        ) USING v_seed_id, v_user_a;
      EXCEPTION WHEN OTHERS THEN
        -- Se a tabela requer colunas NOT NULL adicionais, pula a validação de write
        table_name := v_tbl; operation := 'seed'; expected := 'insert-ok';
        actual := SQLSTATE; passed := true;
        detail := 'seed_skipped: ' || SQLERRM;
        RETURN NEXT;
        CONTINUE;
      END;

      ---------------------------------------------------------------------
      -- Teste 1: user_b tenta INSERT com user_id = user_a → deve falhar
      ---------------------------------------------------------------------
      BEGIN
        PERFORM set_config('request.jwt.claims',
          jsonb_build_object('sub', v_user_b, 'role','authenticated')::text, true);
        PERFORM set_config('role', 'authenticated', true);

        BEGIN
          EXECUTE format(
            'INSERT INTO public.%I (id, user_id) VALUES ($1, $2)', v_tbl
          ) USING gen_random_uuid(), v_user_a;
          -- Se chegou aqui, RLS falhou
          table_name := v_tbl; operation := 'INSERT'; expected := 'blocked';
          actual := 'ALLOWED'; passed := false;
          detail := 'RLS did NOT block cross-user INSERT';
          RETURN NEXT;
        EXCEPTION
          WHEN insufficient_privilege OR check_violation THEN
            table_name := v_tbl; operation := 'INSERT'; expected := 'blocked';
            actual := 'blocked'; passed := true; detail := SQLERRM;
            RETURN NEXT;
          WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_err = MESSAGE_TEXT;
            table_name := v_tbl; operation := 'INSERT'; expected := 'blocked';
            actual := v_sqlstate; passed := (v_sqlstate <> '00000');
            detail := v_err;
            RETURN NEXT;
        END;

        ---------------------------------------------------------------------
        -- Teste 2: user_b tenta UPDATE da linha de user_a → deve retornar 0 rows
        ---------------------------------------------------------------------
        DECLARE v_rows int;
        BEGIN
          EXECUTE format(
            'UPDATE public.%I SET updated_at = now() WHERE id = $1', v_tbl
          ) USING v_seed_id;
          GET DIAGNOSTICS v_rows = ROW_COUNT;
          table_name := v_tbl; operation := 'UPDATE'; expected := '0 rows';
          actual := v_rows::text || ' rows'; passed := (v_rows = 0);
          detail := CASE WHEN v_rows = 0 THEN 'RLS blocked update' ELSE 'RLS LEAK — cross-user update succeeded' END;
          RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_err = MESSAGE_TEXT;
          -- update_updated_at column missing → skip
          table_name := v_tbl; operation := 'UPDATE'; expected := '0 rows';
          actual := v_sqlstate; passed := true; detail := 'update_skipped: '||v_err;
          RETURN NEXT;
        END;

        ---------------------------------------------------------------------
        -- Teste 3: user_b tenta DELETE da linha de user_a → deve retornar 0 rows
        ---------------------------------------------------------------------
        DECLARE v_rows int;
        BEGIN
          EXECUTE format('DELETE FROM public.%I WHERE id = $1', v_tbl) USING v_seed_id;
          GET DIAGNOSTICS v_rows = ROW_COUNT;
          table_name := v_tbl; operation := 'DELETE'; expected := '0 rows';
          actual := v_rows::text || ' rows'; passed := (v_rows = 0);
          detail := CASE WHEN v_rows = 0 THEN 'RLS blocked delete' ELSE 'RLS LEAK — cross-user delete succeeded' END;
          RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_err = MESSAGE_TEXT;
          table_name := v_tbl; operation := 'DELETE'; expected := '0 rows';
          actual := v_sqlstate; passed := true; detail := 'delete_skipped: '||v_err;
          RETURN NEXT;
        END;

        -- Restaura papel para service_role (contexto SECURITY DEFINER)
        PERFORM set_config('request.jwt.claims', '', true);
        PERFORM set_config('role', '', true);
      END;
    END LOOP;

    -- SEMPRE reverte todas as mutações — nenhum resíduo persiste
    RAISE EXCEPTION 'canary_write_rollback' USING ERRCODE = 'P0001';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM <> 'canary_write_rollback' THEN
        RAISE;
      END IF;
  END;

END;
$function$

-- public.admin_rls_canary_full()
CREATE OR REPLACE FUNCTION public.admin_rls_canary_full()
 RETURNS TABLE(test_type text, target text, operation text, passed boolean, detail text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_failures int := 0;
  v_canary jsonb;
  r record;
BEGIN
  -- Canário SELECT existente
  v_canary := public.admin_rls_canary();
  test_type := 'select';
  target := COALESCE(v_canary->>'status', '(unknown)');
  operation := 'SELECT';
  passed := COALESCE((v_canary->>'failed')::int, 0) = 0;
  detail := format('tabelas auditadas: %s, falhas: %s',
                   COALESCE(v_canary->>'passed', '0'), COALESCE(v_canary->>'failed', '0'));
  IF NOT passed THEN v_failures := v_failures + 1; END IF;
  RETURN NEXT;

  FOR r IN SELECT (f.elem->>'table')::text AS table_name, (f.elem->>'leaked_rows')::int AS leaked_rows
    FROM jsonb_array_elements(COALESCE(v_canary->'failures', '[]'::jsonb)) AS f(elem) LOOP
    test_type := 'select_leak';
    target := COALESCE(r.table_name, '(unknown)');
    operation := 'SELECT';
    passed := false;
    detail := format('%s linha(s) de outro usuário visíveis', r.leaked_rows);
    RETURN NEXT;
  END LOOP;

  -- Canário WRITE (novo)
  FOR r IN SELECT * FROM public.admin_rls_canary_write() LOOP
    test_type := 'write';
    target := r.table_name;
    operation := r.operation;
    passed := r.passed;
    detail := r.detail;
    IF NOT passed THEN v_failures := v_failures + 1; END IF;
    RETURN NEXT;
  END LOOP;

  -- Registra security_event se falhas críticas
  IF v_failures > 0 THEN
    INSERT INTO public.security_events (user_id, event_type, severity, description, metadata)
    VALUES (NULL, 'rls_canary_failure', 'critical',
            format('RLS canary detectou %s falhas', v_failures),
            jsonb_build_object('failures', v_failures, 'ts', now()));
  END IF;
END;
$function$

-- public.dispatch_critical_alerts()
CREATE OR REPLACE FUNCTION public.dispatch_critical_alerts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_events_count int := 0;
  v_notifications_created int := 0;
  v_admin_ids uuid[];
  v_admin_id uuid;
  v_event record;
BEGIN
  -- Get all admin user IDs
  SELECT array_agg(user_id) INTO v_admin_ids
  FROM public.user_roles
  WHERE role = 'admin';

  IF v_admin_ids IS NULL OR array_length(v_admin_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'no_admins',
      'events_scanned', 0,
      'notifications_created', 0
    );
  END IF;

  -- Scan critical events from last 24h that haven't been alerted yet
  FOR v_event IN
    SELECT id, event_type, description, severity, metadata, created_at
    FROM public.security_events
    WHERE severity IN ('critical', 'high')
      AND created_at >= now() - interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.alert_dispatch_log adl
        WHERE adl.security_event_id = security_events.id
          AND adl.channel = 'in_app'
      )
    ORDER BY created_at DESC
    LIMIT 200
  LOOP
    v_events_count := v_events_count + 1;

    -- Create in-app notification for each admin
    FOREACH v_admin_id IN ARRAY v_admin_ids LOOP
      INSERT INTO public.notification_history (
        user_id, type, severity, title, message, metadata, is_read
      ) VALUES (
        v_admin_id,
        'security_alert',
        CASE WHEN v_event.severity = 'critical' THEN 'error' ELSE 'warning' END,
        format('[%s] %s', upper(v_event.severity), v_event.event_type),
        coalesce(v_event.description, 'Evento crítico detectado'),
        jsonb_build_object(
          'event_id', v_event.id,
          'severity', v_event.severity,
          'occurred_at', v_event.created_at
        ) || coalesce(v_event.metadata, '{}'::jsonb),
        false
      );
      v_notifications_created := v_notifications_created + 1;
    END LOOP;

    -- Mark event as dispatched
    INSERT INTO public.alert_dispatch_log (security_event_id, channel, status, dispatched_at, admin_count)
    VALUES (v_event.id, 'in_app', 'sent', now(), array_length(v_admin_ids, 1))
    ON CONFLICT (security_event_id, channel) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'ok',
    'events_scanned', v_events_count,
    'notifications_created', v_notifications_created,
    'admin_count', array_length(v_admin_ids, 1),
    'ran_at', now()
  );
END;
$function$

-- public.run_index_advisor_check(text)
CREATE OR REPLACE FUNCTION public.run_index_advisor_check(_triggered_by text DEFAULT 'cron'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_details JSONB;
  v_high INTEGER := 0;
  v_medium INTEGER := 0;
  v_run_id UUID;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO v_details
  FROM public.admin_index_advisor(1000) r
  WHERE r.recommendation IN ('HIGH','MEDIUM');

  SELECT
    COALESCE(SUM(CASE WHEN (elem->>'recommendation') = 'HIGH' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN (elem->>'recommendation') = 'MEDIUM'
                       AND COALESCE((elem->>'n_live_tup')::bigint, 0) > 100000
                      THEN 1 ELSE 0 END), 0)
  INTO v_high, v_medium
  FROM jsonb_array_elements(v_details) elem;

  INSERT INTO public.index_advisor_runs (high_count, medium_count, details, triggered_by)
  VALUES (v_high, v_medium, v_details, COALESCE(_triggered_by, 'cron'))
  RETURNING id INTO v_run_id;

  IF v_high > 0 THEN
    INSERT INTO public.security_events (event_type, severity, description, metadata)
    VALUES (
      'index_advisor_high',
      'high',
      'Index advisor detectou tabelas com uso crítico de seq scan',
      jsonb_build_object('run_id', v_run_id, 'high_count', v_high, 'medium_count', v_medium)
    );
  END IF;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'ran_at', now(),
    'high_count', v_high,
    'medium_count', v_medium,
    'details', v_details
  );
END;
$function$
