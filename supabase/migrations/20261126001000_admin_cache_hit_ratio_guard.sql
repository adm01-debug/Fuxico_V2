-- Corrige o guard de admin da view admin_cache_hit_ratio.
--
-- A definicao original (20260712202614) filtrava com
--   WHERE public.has_role(auth.uid(), 'admin'::app_role)
-- em duas subqueries que usam SUM() sem GROUP BY. Agregado sem GROUP BY
-- produz sempre 1 linha de saida, mesmo quando o WHERE nao seleciona
-- nenhuma linha de entrada: o guard filtrava as linhas de entrada, mas nao
-- a linha agregada. Resultado real medido no banco de producao, lendo a
-- view sob role authenticated com um usuario NAO-admin:
--   index | (null) | (null) | (null)
--   table | (null) | (null) | (null)
-- Ou seja, o nao-admin recebia 2 linhas com todos os campos nulos.
-- Nao havia vazamento de dado, mas o guard era ineficaz.
--
-- Com GROUP BY 1 nos dois ramos, grupo sem linhas de entrada nao produz
-- linha de saida. Medido apos a correcao, mesmo usuario nao-admin: 0 linhas;
-- usuario admin: 2 linhas com valores reais (index 100.00 / table 100.00).
--
-- Nenhum consumidor no front usa esta view (so o types.ts gerado), portanto
-- a mudanca de 2 linhas nulas para 0 linhas nao tem impacto de regressao.

CREATE OR REPLACE VIEW public.admin_cache_hit_ratio
WITH (security_invoker = true) AS
SELECT
  'index' AS cache_type,
  ROUND(SUM(idx_blks_hit)::numeric / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0) * 100, 2) AS hit_ratio_pct,
  SUM(idx_blks_hit) AS hits,
  SUM(idx_blks_read) AS reads
FROM pg_statio_user_indexes
WHERE public.has_role(auth.uid(), 'admin'::app_role)
GROUP BY 1
UNION ALL
SELECT
  'table' AS cache_type,
  ROUND(SUM(heap_blks_hit)::numeric / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100, 2),
  SUM(heap_blks_hit),
  SUM(heap_blks_read)
FROM pg_statio_user_tables
WHERE public.has_role(auth.uid(), 'admin'::app_role)
GROUP BY 1;

REVOKE ALL ON public.admin_cache_hit_ratio FROM PUBLIC, anon;
GRANT SELECT ON public.admin_cache_hit_ratio TO authenticated;
