-- Onda final: view admin_slow_queries + função has_role check
-- Expõe pg_stat_statements de forma segura para admins auditarem queries lentas.

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE OR REPLACE VIEW public.admin_slow_queries
WITH (security_invoker = true)
AS
SELECT
  pss.queryid,
  pss.query,
  pss.calls,
  ROUND(pss.total_exec_time::numeric, 2)   AS total_exec_ms,
  ROUND(pss.mean_exec_time::numeric, 2)    AS mean_exec_ms,
  ROUND(pss.max_exec_time::numeric, 2)     AS max_exec_ms,
  ROUND(pss.stddev_exec_time::numeric, 2)  AS stddev_exec_ms,
  pss.rows,
  ROUND((pss.shared_blks_hit::numeric
         / NULLIF(pss.shared_blks_hit + pss.shared_blks_read, 0)) * 100, 2)
    AS cache_hit_ratio_pct
FROM pg_stat_statements pss
WHERE pss.query NOT ILIKE '%pg_stat_statements%'
  AND pss.query NOT ILIKE '%admin_slow_queries%'
  AND public.has_role(auth.uid(), 'admin'::app_role)
ORDER BY pss.mean_exec_time DESC
LIMIT 200;

REVOKE ALL ON public.admin_slow_queries FROM PUBLIC, anon;
GRANT SELECT ON public.admin_slow_queries TO authenticated;

COMMENT ON VIEW public.admin_slow_queries IS
'Top 200 queries por tempo médio de execução. Visível somente a usuários com role admin (checagem via has_role no WHERE). security_invoker=true garante avaliação de RLS/permissões com o usuário chamador.';

-- Função utilitária para resetar estatísticas (apenas admin)
CREATE OR REPLACE FUNCTION public.reset_slow_query_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_stat_statements_reset();
END;
$$;

REVOKE ALL ON FUNCTION public.reset_slow_query_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_slow_query_stats() TO authenticated;