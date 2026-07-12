-- Onda 24: Reduzir superfície de ataque de funções SECURITY DEFINER
-- Revoga EXECUTE de authenticated/anon/PUBLIC em funções puramente internas
-- (triggers, cron jobs, helpers de sistema). Mantém acesso via service_role,
-- que é usado por triggers do próprio DB e edge functions.

-- 1. Trigger function (só o Postgres invoca)
REVOKE ALL ON FUNCTION public.audit_sensitive_change() FROM PUBLIC, anon, authenticated;

-- 2. Manutenção/particionamento (só cron/service_role)
REVOKE ALL ON FUNCTION public.ensure_future_partitions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_audit_logs_partition(date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_login_attempts_partition(date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_rate_limit_logs_partition(date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_security_events_partition(date) FROM PUBLIC, anon, authenticated;

-- 3. Retenção/limpeza (só cron)
REVOKE ALL ON FUNCTION public.run_retention_cleanup() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_tracking_events_retention() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_challenges() FROM PUBLIC, anon, authenticated;

-- 4. Alertas/bounces (chamado por cron ou edge function)
REVOKE ALL ON FUNCTION public.check_bounce_alerts(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) FROM PUBLIC, anon, authenticated;

-- 5. Tokens/segurança de servidor (edge functions com service_role)
REVOKE ALL ON FUNCTION public.create_password_reset_token(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.use_password_reset_token(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.manage_email_verification_token(uuid, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_email_token(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_webauthn_challenge(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_login_attempt(text, text, boolean, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_login_lockout(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- 6. Locks de singleton (cron)
REVOKE ALL ON FUNCTION public.try_singleton_job(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_singleton_job(text) FROM PUBLIC, anon, authenticated;

-- 7. Contadores internos (chamado por edge functions de sequências)
REVOKE ALL ON FUNCTION public.increment_sequence_completed(uuid) FROM PUBLIC, anon, authenticated;

-- Garante service_role explicitamente (idempotente)
GRANT EXECUTE ON FUNCTION public.audit_sensitive_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_future_partitions() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_audit_logs_partition(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_login_attempts_partition(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_rate_limit_logs_partition(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_security_events_partition(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_retention_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_tracking_events_retention() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_challenges() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_bounce_alerts(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_bounce_alert(uuid, text, numeric, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_password_reset_token(uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.use_password_reset_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.manage_email_verification_token(uuid, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_email_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_webauthn_challenge(uuid, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_webauthn_challenge(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, text, boolean, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_login_lockout(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.try_singleton_job(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_singleton_job(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_sequence_completed(uuid) TO service_role;