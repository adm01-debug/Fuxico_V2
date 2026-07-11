
-- 1. Revoga EXECUTE público em todas as funções do schema public.
--    A seguir, concedemos de volta APENAS às funções que precisam ser chamadas
--    pelo cliente autenticado.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon',
                   r.proname, r.args);
  END LOOP;
END
$$;

-- 2. Reconcede EXECUTE APENAS às funções que o cliente autenticado
--    legitimamente precisa chamar (via RPC).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tracking_stats(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, integer, text, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_emails_with_stats(uuid, integer, uuid, timestamptz, text, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_geo_stats(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lockout_status(text)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_lockout_status(text, text)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_contact_scores(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contact_score(uuid, text)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_bounce_alerts(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_domain_deliverability(uuid) TO authenticated;

-- service_role continua com acesso total (padrão do PostgREST).

-- 3. Remove materialized view do endpoint público da Data API.
REVOKE ALL ON public.email_stats_mv FROM anon, authenticated;
GRANT SELECT ON public.email_stats_mv TO service_role;

-- 4. Fixa search_path na única função pendente (handle_updated_at) e reafirma
--    nas funções trigger que ainda usavam default.
ALTER FUNCTION public.handle_updated_at()             SET search_path = public;
ALTER FUNCTION public.increment_version_column()      SET search_path = public;
ALTER FUNCTION public.update_updated_at_column()      SET search_path = public;
