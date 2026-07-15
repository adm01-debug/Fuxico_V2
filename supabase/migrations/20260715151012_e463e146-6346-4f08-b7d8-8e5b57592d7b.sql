
REVOKE EXECUTE ON FUNCTION public.create_password_reset_token(uuid, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.use_password_reset_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_email_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.manage_email_verification_token(uuid, text, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_webauthn_challenge(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_challenges() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_password_reset_token(uuid, text, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.use_password_reset_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_email_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.manage_email_verification_token(uuid, text, text, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_webauthn_challenge(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_challenges() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) TO service_role;
