REVOKE EXECUTE ON FUNCTION public.compute_adaptive_limit(text, uuid, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_detect_schema_drift() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.replay_failed_webhooks(uuid, integer) FROM anon, PUBLIC;