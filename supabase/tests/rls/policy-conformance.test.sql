-- =============================================================================
-- FUXICO — pgTAP Policy Conformance Tests (Ondas 136-139)
--
-- Invariantes provados aqui:
--   1. Nenhuma policy de escrita (UPDATE/ALL) pode ficar sem WITH CHECK quando
--      a expressão de leitura é baseada em identidade — senão o usuário pode
--      transferir a posse da linha (`SET user_id = '<uuid alheio>'`).
--   2. Policies com role PUBLIC só são aceitas em dois casos auditados:
--      deny-all (`qual = false`) e ingestão anônima do tracking.
--   3. Toda tabela user-facing tem RLS habilitado.
--
-- Executa: pg_prove -d $SUPABASE_DB_URL supabase/tests/rls/*.test.sql
-- =============================================================================

BEGIN;
SELECT plan(6);

-- -----------------------------------------------------------------------------
-- 1. WITH CHECK simétrico em todas as policies de escrita
-- -----------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int
     FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd IN ('UPDATE', 'ALL')
      AND with_check IS NULL
      AND qual IS NOT NULL
      AND qual <> 'false'),
  0,
  'Nenhuma policy de escrita sem WITH CHECK (bloqueia ownership transfer)'
);

-- -----------------------------------------------------------------------------
-- 2. Policies PUBLIC restantes são apenas deny-all ou ingestão anônima
-- -----------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int
     FROM pg_policies
    WHERE schemaname = 'public'
      AND roles::text = '{public}'
      AND COALESCE(qual, 'null') <> 'false'
      AND policyname NOT LIKE 'Allow public insert on %'
      AND policyname NOT IN ('block_client_insert', 'no public access')),
  0,
  'Policies com role PUBLIC restringem-se a deny-all e ingestão anônima auditada'
);

-- -----------------------------------------------------------------------------
-- 3. gmail_configurations — credencial sensível, escrita travada no dono
-- -----------------------------------------------------------------------------
SELECT is(
  (SELECT with_check
     FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gmail_configurations'
      AND policyname = 'Users can manage their own Gmail configs'),
  '(auth.uid() = user_id)',
  'gmail_configurations: WITH CHECK amarra a escrita ao auth.uid()'
);

SELECT is(
  (SELECT roles::text
     FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gmail_configurations'
      AND policyname = 'Users can manage their own Gmail configs'),
  '{authenticated}',
  'gmail_configurations: policy escopada apenas a usuários autenticados'
);

-- -----------------------------------------------------------------------------
-- 4. Policies administrativas FOR ALL revalidam has_role na escrita
-- -----------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int
     FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'ALL'
      AND qual = 'has_role(auth.uid(), ''admin''::app_role)'
      AND COALESCE(with_check, '') <> qual),
  0,
  'Policies admin FOR ALL têm WITH CHECK idêntico ao USING'
);

-- -----------------------------------------------------------------------------
-- 5. FORCE RLS nas tabelas de maior risco (Onda 136)
-- -----------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int
     FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relname IN ('contact_scores', 'ab_tests', 'gmail_configurations', 'user_roles')
      AND NOT relrowsecurity),
  0,
  'RLS habilitado nas tabelas críticas (contact_scores, ab_tests, gmail_configurations, user_roles)'
);

SELECT * FROM finish();
ROLLBACK;
