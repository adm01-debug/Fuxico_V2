-- =====================================================================
-- Onda 139: WITH CHECK simétrico + normalização de role nas partições
-- =====================================================================

-- 1. gmail_configurations: FOR ALL sem WITH CHECK permitia INSERT/UPDATE
--    com user_id arbitrário (ownership transfer / injeção de credencial).
DROP POLICY IF EXISTS "Users can manage their own Gmail configs" ON public.gmail_configurations;
CREATE POLICY "Users can manage their own Gmail configs"
  ON public.gmail_configurations FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Policies administrativas FOR ALL sem WITH CHECK
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual
      FROM pg_policies
     WHERE schemaname = 'public'
       AND cmd = 'ALL'
       AND with_check IS NULL
       AND qual = 'has_role(auth.uid(), ''admin''::app_role)'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      r.policyname, r.tablename, r.qual, r.qual
    );
  END LOOP;
END$$;

-- 3. Normalização de role nas partições: policies de identidade que ainda
--    rodavam como PUBLIC passam a TO authenticated.
--    Excluídas de propósito:
--      - 'block_client_insert' / 'no public access' (deny-all: PUBLIC é mais forte)
--      - 'Allow public insert on ...' (ingestão anônima do pixel/click tracking)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check
      FROM pg_policies
     WHERE schemaname = 'public'
       AND roles::text = '{public}'
       AND policyname IN (
         'own_select','admin_select','auth_insert_own',
         'own_or_admin_select','own_insert','own_via_tracked_emails_select'
       )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR %s TO authenticated %s %s',
      r.policyname, r.tablename, r.cmd,
      CASE WHEN r.qual IS NOT NULL THEN 'USING (' || r.qual || ')' ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN 'WITH CHECK (' || r.with_check || ')' ELSE '' END
    );
  END LOOP;
END$$;

-- 4. Asserção de conformidade: nenhuma policy de escrita pode ficar sem
--    WITH CHECK quando a expressão de leitura é baseada em identidade.
DO $$
DECLARE
  v_gap INTEGER;
BEGIN
  SELECT count(*) INTO v_gap
    FROM pg_policies
   WHERE schemaname = 'public'
     AND cmd IN ('UPDATE','ALL')
     AND with_check IS NULL
     AND qual IS NOT NULL
     AND qual <> 'false';
  IF v_gap > 0 THEN
    RAISE EXCEPTION 'Onda 139: ainda existem % policies de escrita sem WITH CHECK', v_gap;
  END IF;
END$$;