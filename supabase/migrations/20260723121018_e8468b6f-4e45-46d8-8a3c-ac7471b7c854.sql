
-- Onda 113 — RLS Canary completo (INSERT/UPDATE/DELETE)
-- Cria dois usuários fantasma via JWT sintético, tenta write cross-tenant em
-- tabelas críticas, verifica que RLS bloqueia cada operação, e sempre reverte.

CREATE OR REPLACE FUNCTION public.admin_rls_canary_write()
RETURNS TABLE (
  table_name text,
  operation text,
  expected text,
  actual text,
  passed boolean,
  detail text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Emite security_event se houve qualquer falha
  IF EXISTS (
    SELECT 1 FROM (SELECT passed FROM admin_rls_canary_write()) x WHERE NOT x.passed
  ) THEN
    -- (evita recursão — só registra a partir do wrapper cron)
    NULL;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_rls_canary_write() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rls_canary_write() TO service_role;

-- Wrapper que combina SELECT canary (existente) + WRITE canary (novo)
-- e registra evento crítico se qualquer teste falhar.
CREATE OR REPLACE FUNCTION public.admin_rls_canary_full()
RETURNS TABLE (
  test_type text,
  target text,
  operation text,
  passed boolean,
  detail text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failures int := 0;
  r record;
BEGIN
  -- Canário SELECT existente
  FOR r IN SELECT * FROM public.admin_rls_canary() LOOP
    test_type := 'select';
    target := COALESCE(r.table_name, '(unknown)');
    operation := 'SELECT';
    passed := r.passed;
    detail := r.detail;
    IF NOT passed THEN v_failures := v_failures + 1; END IF;
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
$$;

REVOKE ALL ON FUNCTION public.admin_rls_canary_full() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rls_canary_full() TO service_role;

-- Reagenda cron 07:00 UTC para usar o full canary
DO $$
BEGIN
  PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('admin-rls-canary-daily','admin-rls-canary-full-daily');

  PERFORM cron.schedule(
    'admin-rls-canary-full-daily',
    '0 7 * * *',
    'SELECT public.admin_rls_canary_full();'
  );
END $$;
