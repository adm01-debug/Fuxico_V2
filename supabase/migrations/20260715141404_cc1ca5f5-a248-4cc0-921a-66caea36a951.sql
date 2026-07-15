
REVOKE EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_ip_whitelisted(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_ip_whitelisted(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_ip_blocked(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(text) TO service_role;
