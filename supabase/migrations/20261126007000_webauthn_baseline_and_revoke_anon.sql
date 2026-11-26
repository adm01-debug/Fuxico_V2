-- =============================================================================
-- WebAuthn: baseline das tabelas e fechamento do EXECUTE indevido em anon
--
-- Contexto (evidencia coletada em producao em 2026-11-26):
--
-- 1) public.webauthn_challenges e public.webauthn_credentials existiam em
--    producao (schema public) SEM nenhum CREATE TABLE no repositorio. As do
--    schema auth sao nativas do GoTrue e nao sao tocadas aqui; as de public sao
--    do projeto e sao usadas pelas funcoes create_webauthn_challenge,
--    verify_webauthn_challenge e cleanup_expired_challenges (esta ultima roda
--    no pg_cron 'fuxico-cleanup-webauthn-challenges'). O drift quebrava
--    qualquer rebuild a partir das migrations.
--
-- 2) public.verify_webauthn_challenge(text) e SECURITY DEFINER e faz
--    DELETE ... RETURNING wc.user_id, wc.email, wc.type. Ou seja: quem chama
--    recebe user_id e email do dono do challenge. Em producao
--    has_function_privilege('anon', ..., 'EXECUTE') retornava TRUE, apesar das
--    migrations 20260712214211 e 20260715151012 ja revogarem isso no repo:
--    aquelas migrations nunca foram aplicadas no banco. Resultado: qualquer
--    anonimo que apresentasse um challenge valido obtinha o email e o user_id
--    do usuario correspondente, e consumia o challenge alheio.
--
-- Correcao: revogar EXECUTE de PUBLIC/anon/authenticated nas tres funcoes,
-- manter apenas service_role, e materializar o baseline das duas tabelas.
--
-- Idempotente: pode rodar em cima do estado atual de producao sem erro.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Baseline das tabelas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  challenge text NOT NULL,
  type text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webauthn_challenges_type_check
    CHECK (type = ANY (ARRAY['registration'::text, 'authentication'::text]))
);

CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  device_type text,
  backed_up boolean DEFAULT false,
  transports text[],
  credential_name text,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webauthn_credentials_credential_id_key UNIQUE (credential_id)
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_challenge
  ON public.webauthn_challenges USING btree (challenge);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id
  ON public.webauthn_challenges USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id
  ON public.webauthn_credentials USING btree (user_id);

-- -----------------------------------------------------------------------------
-- 2. RLS e policies (espelho do estado de producao)
-- -----------------------------------------------------------------------------
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can view their own challenges"
  ON public.webauthn_challenges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can view their own credentials"
  ON public.webauthn_credentials FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can insert their own credentials"
  ON public.webauthn_credentials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can update their own credentials"
  ON public.webauthn_credentials FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can delete their own credentials"
  ON public.webauthn_credentials FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Privilegios de tabela: anon nao tem nada a fazer aqui
-- -----------------------------------------------------------------------------
REVOKE ALL ON TABLE public.webauthn_challenges FROM anon;
REVOKE ALL ON TABLE public.webauthn_credentials FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webauthn_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webauthn_credentials TO authenticated;
GRANT ALL ON TABLE public.webauthn_challenges TO service_role;
GRANT ALL ON TABLE public.webauthn_credentials TO service_role;

-- -----------------------------------------------------------------------------
-- 4. Funcoes WebAuthn: apenas service_role executa
--    verify_webauthn_challenge() e SECURITY DEFINER e devolve user_id/email,
--    por isso nunca pode ser alcancavel por anon.
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.verify_webauthn_challenge(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_challenges() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.verify_webauthn_challenge(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_challenges() TO service_role;