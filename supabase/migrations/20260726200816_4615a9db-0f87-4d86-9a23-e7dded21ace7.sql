-- Onda 133: Hardening de superfície de execução (SECURITY DEFINER)
-- Rotinas internas (cron/manutenção/infra) não devem ser expostas via Data API.
REVOKE EXECUTE ON FUNCTION public.run_cron_job(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_schema() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_index_advisor_runs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_index_advisor_check() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_index_advisor_check(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_dsar_sla_misses() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wcb_can_dispatch(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wcb_record_result(uuid, boolean, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_adaptive_limit(text, uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_bounce_alerts(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_ab_metrics(uuid, text, integer, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_find_orphan_pii() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_detect_schema_drift() FROM anon, authenticated;

-- Garante que os processos internos continuem operando.
GRANT EXECUTE ON FUNCTION public.run_cron_job(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.snapshot_schema() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_index_advisor_runs() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_index_advisor_check() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_index_advisor_check(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.count_dsar_sla_misses() TO service_role;
GRANT EXECUTE ON FUNCTION public.wcb_can_dispatch(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.wcb_record_result(uuid, boolean, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.compute_adaptive_limit(text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_bounce_alerts(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_ab_metrics(uuid, text, integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_find_orphan_pii() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_detect_schema_drift() TO service_role;