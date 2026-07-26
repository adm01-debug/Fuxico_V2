-- ============================================================
-- Onda 138: Normalização do role das policies (public -> authenticated)
-- Regra de decisão: toda policy cuja expressão referencia auth.uid()
-- é, por definição, uma policy de identidade -> deve ser TO authenticated.
-- Policies públicas legítimas (ingestão de tracking) e policies de
-- negação (`false`) permanecem intactas.
-- ============================================================

DO $$
DECLARE
  r        RECORD;
  v_qual   TEXT;
  v_check  TEXT;
  v_sql    TEXT;
  v_count  INT := 0;
BEGIN
  FOR r IN
    SELECT n.nspname AS sch, c.relname AS tbl, p.polname AS pol,
           pg_get_expr(p.polqual, p.polrelid)      AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS wcheck
      FROM pg_policy p
      JOIN pg_class c     ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND p.polroles = ARRAY[0]::oid[]                    -- role PUBLIC
       AND ( coalesce(pg_get_expr(p.polqual, p.polrelid), '')
           || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ) LIKE '%auth.uid()%'
  LOOP
    v_qual  := r.qual;
    v_check := r.wcheck;

    v_sql := format('ALTER POLICY %I ON %I.%I TO authenticated', r.pol, r.sch, r.tbl);
    IF v_qual IS NOT NULL THEN
      v_sql := v_sql || format(' USING (%s)', v_qual);
    END IF;
    IF v_check IS NOT NULL THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
    END IF;

    EXECUTE v_sql;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Policies normalizadas para authenticated: %', v_count;
END $$;

-- Guarda: nenhuma policy de identidade pode restar com role PUBLIC
DO $$
DECLARE v_left INT;
BEGIN
  SELECT count(*) INTO v_left
    FROM pg_policy p
    JOIN pg_class c     ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND p.polroles = ARRAY[0]::oid[]
     AND ( coalesce(pg_get_expr(p.polqual, p.polrelid), '')
         || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ) LIKE '%auth.uid()%';

  IF v_left > 0 THEN
    RAISE EXCEPTION 'Restaram % policies de identidade com role PUBLIC', v_left;
  END IF;
END $$;