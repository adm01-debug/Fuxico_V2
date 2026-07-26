-- ============================================================
-- Onda 136: Hardening de RLS em contact_scores e ab_tests
-- Correções:
--   1. UPDATE sem WITH CHECK permitia "ownership transfer" (IDOR vertical):
--      UPDATE ... SET user_id = '<outro-uuid>' era aceito.
--   2. Policies com role {public} incluem anon desnecessariamente.
--   3. FORCE ROW LEVEL SECURITY para que nem o owner (não-superuser)
--      escape das policies. postgres/service_role possuem BYPASSRLS,
--      portanto cron jobs e edge functions permanecem funcionais.
-- ============================================================

-- ---------- contact_scores ----------
DROP POLICY IF EXISTS "Users can view their own contact scores"   ON public.contact_scores;
DROP POLICY IF EXISTS "Users can insert their own contact scores" ON public.contact_scores;
DROP POLICY IF EXISTS "Users can update their own contact scores" ON public.contact_scores;
DROP POLICY IF EXISTS "Users can delete their own contact scores" ON public.contact_scores;

CREATE POLICY "contact_scores_select_own"
  ON public.contact_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "contact_scores_insert_own"
  ON public.contact_scores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_scores_update_own"
  ON public.contact_scores FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_scores_delete_own"
  ON public.contact_scores FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.contact_scores FORCE ROW LEVEL SECURITY;

-- ---------- ab_tests ----------
DROP POLICY IF EXISTS "Users can view their own ab tests"   ON public.ab_tests;
DROP POLICY IF EXISTS "Users can insert their own ab tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Users can update their own ab tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Users can delete their own ab tests" ON public.ab_tests;

CREATE POLICY "ab_tests_select_own"
  ON public.ab_tests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ab_tests_insert_own"
  ON public.ab_tests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ab_tests_update_own"
  ON public.ab_tests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ab_tests_delete_own"
  ON public.ab_tests FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.ab_tests FORCE ROW LEVEL SECURITY;

-- Garantias de privilégio (Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ab_tests       TO authenticated;
GRANT ALL ON public.contact_scores TO service_role;
GRANT ALL ON public.ab_tests       TO service_role;
REVOKE ALL ON public.contact_scores FROM anon;
REVOKE ALL ON public.ab_tests       FROM anon;