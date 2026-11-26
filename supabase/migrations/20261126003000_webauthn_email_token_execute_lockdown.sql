-- =============================================================================
-- Hardening: criacao de challenge WebAuthn e de token de verificacao de e-mail
-- estavam executaveis por `anon`, permitindo forjar 2FA e verificacao de e-mail
-- de QUALQUER conta sem autenticacao.
--
-- Projeto de producao: xmyvefffgltlrobazrmg
--
-- Evidencias coletadas por probe real com a chave publica (sem login), ANTES do fix:
--
--   POST /rest/v1/rpc/create_webauthn_challenge
--     {"_user_id":"<uuid da vitima>","_email":"<email da vitima>",
--      "_challenge":"pwned-probe-xyz","_type":"authentication", ...}
--     -> HTTP 200: a funcao e SECURITY DEFINER, grava em `webauthn_challenges`
--        sem nenhuma validacao de `_user_id` contra `auth.uid()`. Qualquer anonimo
--        injetava uma challenge escolhida por ele para a conta alvo.
--
--   POST /rest/v1/rpc/manage_email_verification_token {"_user_id":"<uuid alheio>", ...}
--     -> HTTP 200: mesma causa, grava em `email_verification_tokens` um token
--        conhecido pelo atacante para o e-mail de outra pessoa.
--
--   POST /rest/v1/rpc/verify_webauthn_challenge {"_challenge":"pwned-probe-xyz"}
--     -> devolve `user_id`, `email` e `type` da vitima (DELETE ... RETURNING,
--        portanto consumo de uso unico).
--   POST /rest/v1/rpc/verify_email_token {"_token":"pwned-probe-xyz"} -> true.
--
-- Encadeando os dois passos, um anonimo provava posse de uma challenge/token que
-- ele mesmo acabou de criar para a conta de outra pessoa -- bypass completo do
-- segundo fator e da verificacao de e-mail.
--
-- Corrigir o grant e suficiente: as tabelas de destino ja estao travadas
-- (`relrowsecurity = true`, apenas SELECT com `auth.uid() = user_id`), logo a
-- unica porta de escrita era a funcao SECURITY DEFINER.
--
-- DEPOIS do fix (probe real com a chave publica):
--   create_webauthn_challenge           -> HTTP 401 {"code":"42501",
--                                          "message":"permission denied for function create_webauthn_challenge"}
--   manage_email_verification_token     -> HTTP 401 {"code":"42501",
--                                          "message":"permission denied for function manage_email_verification_token"}
--   verify_email_token {"_token":"x"}   -> HTTP 200 false (fluxo publico preservado)
--   verify_webauthn_challenge           -> segue em `anon`; sem `create_*` publico
--                                          deixa de existir challenge forjavel.
--
-- Nao ha consumidor no repositorio: `git grep` em `origin/main` (fora de
-- `supabase/migrations`) encontra essas funcoes apenas em
-- `src/integrations/supabase/types.ts`, arquivo gerado. Nenhuma tela, hook ou
-- edge function as invoca -- revogar nao quebra fluxo algum.
--
-- ORDEM DE APLICACAO: este arquivo tem timestamp posterior a
-- `20261125224500_security_hardening_anon_pii_e_execute.sql`, que re-concede
-- EXECUTE a `anon` para estas duas funcoes na allowlist `v_anon`. Aplicar na
-- ordem natural das migrations e o que garante o fechamento.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.create_webauthn_challenge(
  uuid, text, text, text, timestamp with time zone
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_webauthn_challenge(
  uuid, text, text, text, timestamp with time zone
) TO service_role;

REVOKE EXECUTE ON FUNCTION public.manage_email_verification_token(
  uuid, text, text, timestamp with time zone
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.manage_email_verification_token(
  uuid, text, text, timestamp with time zone
) TO service_role;