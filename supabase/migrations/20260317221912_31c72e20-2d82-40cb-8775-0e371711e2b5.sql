
-- Revoke anon access to materialized view (already partially done)
-- The MV stays in public schema but we restrict direct API access
REVOKE ALL ON public.email_stats_mv FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.email_stats_mv FROM authenticated;
