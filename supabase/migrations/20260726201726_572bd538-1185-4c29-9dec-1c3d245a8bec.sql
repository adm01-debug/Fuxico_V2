-- ============================================================
-- Onda 137: Fechamento global da brecha "ownership transfer"
-- Toda policy de UPDATE sem WITH CHECK permite que a linha seja
-- reescrita para um dono diferente (a USING só valida a linha ANTIGA).
-- Aqui espelhamos a expressão USING em WITH CHECK e restringimos
-- o role para `authenticated`.
-- ============================================================

DO $$
DECLARE
  r RECORD;
  v_qual TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'UPDATE'
      AND with_check IS NULL
  LOOP
    SELECT pg_get_expr(p.polqual, p.polrelid)
      INTO v_qual
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = r.schemaname
       AND c.relname = r.tablename
       AND p.polname = r.policyname;

    IF v_qual IS NULL THEN
      RAISE NOTICE 'Policy %.% -> % sem USING; ignorada', r.schemaname, r.tablename, r.policyname;
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated USING (%s) WITH CHECK (%s)',
      r.policyname, r.schemaname, r.tablename, v_qual, v_qual
    );

    RAISE NOTICE 'Hardened: %.% -> %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- Verificação: deve retornar zero linhas
DO $$
DECLARE v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public' AND cmd = 'UPDATE' AND with_check IS NULL;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Ainda existem % policies de UPDATE sem WITH CHECK', v_count;
  END IF;
END $$;