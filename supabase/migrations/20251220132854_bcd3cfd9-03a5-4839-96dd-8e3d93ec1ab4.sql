-- Remover a materialized view da API pública (security fix)
REVOKE SELECT ON email_stats_mv FROM anon;
REVOKE SELECT ON email_stats_mv FROM public;

-- Manter apenas para authenticated users que acessam via RPC
GRANT SELECT ON email_stats_mv TO authenticated;