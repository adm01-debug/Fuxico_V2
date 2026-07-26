-- =============================================================================
-- FUXICO — pgTAP RPC Authorization Tests (Onda 135)
--
-- Objetivo: provar que as RPCs `SECURITY DEFINER` que recebem um identificador
-- de usuário como PARÂMETRO não confiam nesse parâmetro, e sim na identidade
-- real do chamador (`auth.uid()` / claim `email` do JWT).
--
-- Ataque modelado (IDOR horizontal):
--   Usuário A autentica-se legitimamente e chama a RPC passando o `user_id`
--   do usuário B. Sem guarda, a função executa no contexto do OWNER (bypass de
--   RLS) e lê/escreve dados de B.
--
-- Executa: pg_prove -d $SUPABASE_DB_URL supabase/tests/rls/*.test.sql
-- =============================================================================

BEGIN;
SELECT plan(16);

-- -----------------------------------------------------------------------------
-- Helpers: simula um JWT do PostgREST para um usuário arbitrário
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.act_as(_uid uuid, _email text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', _uid::text,
      'role', 'authenticated',
      'email', COALESCE(_email, _uid::text || '@example.test')
    )::text,
    true
  );
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.act_as_anon()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
END;
$$;

-- Identidades fixas para o cenário atacante (A) x vítima (B)
CREATE TEMP TABLE _actors AS
SELECT
  '11111111-1111-4111-8111-111111111111'::uuid AS attacker,
  '22222222-2222-4222-8222-222222222222'::uuid AS victim;

-- =============================================================================
-- 1. is_service_context(): não pode reportar contexto de serviço para um
--    usuário autenticado comum (senão todas as guardas caem juntas).
-- =============================================================================
SELECT pg_temp.act_as((SELECT attacker FROM _actors));

SELECT is(
  public.is_service_context(), false,
  'is_service_context() é false para um usuário autenticado comum'
);

SELECT is(
  (SELECT auth.uid()), (SELECT attacker FROM _actors),
  'harness: auth.uid() reflete o JWT simulado'
);

-- =============================================================================
-- 2. update_contact_score — escrita cruzada em contact_scores
-- =============================================================================
SELECT throws_ok(
  format(
    'SELECT public.update_contact_score(%L::uuid, %L)',
    (SELECT victim FROM _actors), 'alvo@example.test'
  ),
  '42501',
  NULL,
  'update_contact_score: atacante NÃO escreve na pontuação de outro usuário'
);

SELECT lives_ok(
  format(
    'SELECT public.update_contact_score(%L::uuid, %L)',
    (SELECT attacker FROM _actors), 'proprio@example.test'
  ),
  'update_contact_score: usuário atualiza a própria pontuação normalmente'
);

-- =============================================================================
-- 3. recalculate_all_contact_scores — varredura/escrita em massa cruzada
-- =============================================================================
SELECT throws_ok(
  format(
    'SELECT public.recalculate_all_contact_scores(%L::uuid)',
    (SELECT victim FROM _actors)
  ),
  '42501',
  NULL,
  'recalculate_all_contact_scores: atacante NÃO recalcula a base de outro usuário'
);

SELECT lives_ok(
  format(
    'SELECT public.recalculate_all_contact_scores(%L::uuid)',
    (SELECT attacker FROM _actors)
  ),
  'recalculate_all_contact_scores: usuário recalcula a própria base normalmente'
);

-- =============================================================================
-- 4. promote_ab_winner — promoção de teste A/B alheio
-- =============================================================================
INSERT INTO public.ab_tests (
  id, user_id, name, status,
  variant_a_subject, variant_b_subject,
  variant_a_body, variant_b_body
)
SELECT
  '33333333-3333-4333-8333-333333333333'::uuid, victim,
  'Teste da vítima', 'running', 'Assunto A', 'Assunto B', 'Corpo A', 'Corpo B'
FROM _actors;

SELECT throws_ok(
  $$SELECT public.promote_ab_winner('33333333-3333-4333-8333-333333333333'::uuid, 'A')$$,
  '42501',
  NULL,
  'promote_ab_winner: atacante NÃO promove variante em teste A/B alheio'
);

SELECT is(
  (SELECT winner_promoted_at FROM public.ab_tests
    WHERE id = '33333333-3333-4333-8333-333333333333'::uuid),
  NULL,
  'promote_ab_winner: o teste da vítima permanece intacto após a tentativa'
);

SELECT is(
  (SELECT count(*)::int FROM public.email_templates
    WHERE category = 'A/B Winners'
      AND user_id = (SELECT victim FROM _actors)),
  0,
  'promote_ab_winner: nenhum template foi injetado na conta da vítima'
);

SELECT throws_ok(
  $$SELECT public.promote_ab_winner('33333333-3333-4333-8333-333333333333'::uuid, 'Z')$$,
  '22023',
  NULL,
  'promote_ab_winner: variante inválida é rejeitada antes de qualquer escrita'
);

-- =============================================================================
-- 5. reset_login_lockout — bypass da proteção anti-força-bruta
-- =============================================================================
INSERT INTO public.login_lockouts (email, locked_until, failed_attempts)
VALUES ('vitima@example.test', now() + interval '30 minutes', 5);

-- Atacante autenticado com OUTRO e-mail
SELECT pg_temp.act_as((SELECT attacker FROM _actors), 'atacante@example.test');

SELECT throws_ok(
  $$SELECT public.reset_login_lockout('vitima@example.test')$$,
  '42501',
  NULL,
  'reset_login_lockout: atacante NÃO libera o bloqueio de outro e-mail'
);

SELECT is(
  (SELECT count(*)::int FROM public.login_lockouts
    WHERE email = 'vitima@example.test'),
  1,
  'reset_login_lockout: o bloqueio da vítima continua ativo'
);

-- A própria vítima (mesmo claim de e-mail) consegue liberar
SELECT pg_temp.act_as((SELECT victim FROM _actors), 'vitima@example.test');

SELECT lives_ok(
  $$SELECT public.reset_login_lockout('vitima@example.test')$$,
  'reset_login_lockout: o próprio dono do e-mail libera o seu bloqueio'
);

SELECT is(
  (SELECT count(*)::int FROM public.login_lockouts
    WHERE email = 'vitima@example.test'),
  0,
  'reset_login_lockout: bloqueio removido para o dono legítimo'
);

-- Entrada inválida
SELECT throws_ok(
  $$SELECT public.reset_login_lockout('')$$,
  '22023',
  NULL,
  'reset_login_lockout: e-mail vazio é rejeitado'
);

-- =============================================================================
-- 6. Chamador anônimo não pode acionar as rotinas com user_id arbitrário
-- =============================================================================
SELECT pg_temp.act_as_anon();

SELECT throws_ok(
  format(
    'SELECT public.update_contact_score(%L::uuid, %L)',
    (SELECT victim FROM _actors), 'alvo@example.test'
  ),
  '42501',
  NULL,
  'update_contact_score: chamador anônimo é bloqueado'
);

SELECT * FROM finish();
ROLLBACK;
