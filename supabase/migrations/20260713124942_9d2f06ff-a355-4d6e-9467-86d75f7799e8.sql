
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_sequence_completed(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_sequence_completed(uuid) TO service_role;
