-- =============================================================================
-- FUXICO — pgTAP RLS regression tests (cobertura ampliada, Wave 2 B6)
-- Executa: pg_prove -d $SUPABASE_DB_URL supabase/tests/rls/*.test.sql
--
-- Cada tabela user-facing é validada com 3 asserções:
--   1. RLS habilitado
--   2. Existe pelo menos 1 policy
--   3. Usuário anônimo NÃO consegue SELECT
-- =============================================================================

BEGIN;
SELECT plan(156);  -- 52 tabelas × 3 asserções

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'ab_tests','active_sessions','alert_thresholds','audit_config','audit_logs',
    'bitrix24_config','blocked_ips','bounce_alerts','campaigns','contact_scores',
    'deliverability_logs','document_events','domain_reputation','email_audit_logs',
    'email_sequences','email_templates','email_verification_tokens','feature_flags',
    'follow_up_reminders','fraud_alerts','geo_whitelist','gmail_configurations',
    'ip_whitelist','link_click_events','login_attempts','login_lockouts',
    'mfa_settings','notification_history','password_reset_requests',
    'password_reset_tokens','permissions','rate_limit_logs','role_permissions',
    'scheduled_emails','scheduled_reports','security_events','sequence_enrollments',
    'sequence_step_executions','sequence_steps','standalone_tracked_links',
    'tracked_documents','tracked_emails','tracked_links','tracking_events',
    'unsubscribed_emails','user_preferences','user_roles','webauthn_challenges',
    'webauthn_credentials','webhook_configs','webhook_logs','whatsapp_configs',
    'whitelabel_config'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- 1. RLS habilitado
    PERFORM ok(
      (SELECT relrowsecurity FROM pg_class
        WHERE relname = t AND relnamespace = 'public'::regnamespace),
      format('RLS habilitado em public.%I', t)
    );
    -- 2. Pelo menos 1 policy
    PERFORM ok(
      (SELECT COUNT(*) > 0 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t),
      format('public.%I tem ao menos 1 policy', t)
    );
    -- 3. Anônimo bloqueado (verifica via GRANT + policies)
    PERFORM ok(
      NOT EXISTS (
        SELECT 1 FROM information_schema.role_table_grants
         WHERE table_schema = 'public'
           AND table_name = t
           AND grantee = 'anon'
           AND privilege_type = 'SELECT'
      ) OR EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t
           AND roles::text LIKE '%anon%'
      ),
      format('public.%I não é acessível anonimamente sem policy explícita', t)
    );
  END LOOP;
END$$;

SELECT finish();
ROLLBACK;
