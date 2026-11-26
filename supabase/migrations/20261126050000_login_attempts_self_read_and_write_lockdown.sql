-- Historico de tentativas de login: leitura das proprias tentativas + fim da escrita direta.
--
-- Dois problemas nesta area, ambos encontrados por auditoria de cobertura
-- (objeto de banco sem consumidor correspondente no app):
--
-- 1) `login_attempts` so tinha policy de SELECT para admin
--    ("Admins can view login attempts" -> has_role(auth.uid(), 'admin')).
--    O card "Tentativas de login (24h)" de
--    src/features/security/components/SecurityOverviewCards.tsx:57-72 filtra
--    por `email = user.email` para QUALQUER usuario autenticado. Resultado: para
--    o usuario comum a query voltava sempre vazia, mesmo com dados na tabela.
--
-- 2) anon/authenticated tinham INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER
--    concedidos em login_attempts e login_lockouts. A escrita legitima vem de
--    public.record_login_attempt / record_failed_login / reset_login_lockout,
--    todas SECURITY DEFINER (rodam como owner), logo os privilegios diretos sao
--    desnecessarios. O RLS ja bloqueava por falta de policy de INSERT, mas o
--    grant sobrava como superficie de ataque.
--
-- 3) `login_attempts.ip_address` era NOT NULL (tabela particionada,
--    login_attempts_YYYY_MM) e public.record_login_attempt insere o valor
--    recebido sem tratar NULL. Como o login no browser nao sabe o IP do
--    cliente, TODA chamada sem _ip_address abortava com:
--      ERROR 23502: null value in column "ip_address" of relation
--      "login_attempts_2026_11" violates not-null constraint
--    ou seja, a funcao falhava 100% das vezes e o historico ficava vazio. IP
--    desconhecido e um estado legitimo (login por email/senha no cliente), por
--    isso a coluna passa a aceitar NULL.
--
-- Verificado em producao antes desta migration (2026-11-26):
--   select count(*) from public.login_attempts                          -> 0
--   select count(*) from public.login_lockouts                          -> 1
--   has_function_privilege('anon','public.record_login_attempt(...)','execute') -> true
--   policies de login_attempts                                          -> somente admin (SELECT)
--   consumidores no src: apenas SELECT (SecurityOverviewCards / LockedAccountsPanel)
--
-- Idempotente: DROP POLICY IF EXISTS antes do CREATE; REVOKEs repetiveis.

DROP POLICY IF EXISTS "Users can view own login attempts" ON public.login_attempts;

CREATE POLICY "Users can view own login attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.login_attempts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.login_lockouts FROM anon, authenticated;

ALTER TABLE public.login_attempts ALTER COLUMN ip_address DROP NOT NULL;
