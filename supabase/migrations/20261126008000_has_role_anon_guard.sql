-- =============================================================================
-- has_role / has_permission: anon nao pode consultar papeis de terceiros
--
-- Evidencia (probe real em producao, 2026-11-26), ANTES do fix:
--
--   SET role anon;
--   SET request.jwt.claims='{"role":"anon"}';
--   SELECT public.has_role('f1b31f10-d168-4743-a7b9-f1c19e66f030','admin');
--   -> true
--
-- Ambas as funcoes usavam apenas:
--   IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN RETURN false; END IF;
-- Para `anon` auth.uid() e NULL, entao a condicao era falsa e a funcao respondia
-- normalmente: qualquer anonimo que tivesse um uuid de usuario descobria se ele e
-- admin ou quais permissoes possui. Enumercao de privilegios sem login.
--
-- Correcao: quando nao ha identidade (auth.uid() nulo) e tambem nao ha contexto de
-- servico, responder false. has_role/has_permission sao chamadas por 61 policies RLS
-- e 35 funcoes, por isso o resto do comportamento e preservado byte a byte:
--   * authenticated consultando o proprio id  -> inalterado
--   * authenticated consultando outro id      -> inalterado (false)
--   * service_role / pg_cron / psql direto    -> inalterado (is_service_context() = true)
--   * policies RLS avaliadas para anon        -> ja retornavam false, agora cedo
--
-- Idempotente (CREATE OR REPLACE).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL AND NOT public.is_service_context() THEN
    RETURN false;
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL AND NOT public.is_service_context() THEN
    RETURN false;
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role=rp.role
    JOIN public.permissions p ON rp.permission_id=p.id
    WHERE ur.user_id=_user_id AND p.permission_key=_permission_key
  );
END;
$function$;