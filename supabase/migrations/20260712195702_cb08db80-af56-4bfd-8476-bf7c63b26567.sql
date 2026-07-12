DO $$
DECLARE
  t text;
  critical text[] := ARRAY[
    'user_roles',
    'role_permissions',
    'permissions',
    'gmail_configurations',
    'webhook_configs',
    'bitrix24_config',
    'whatsapp_configs',
    'blocked_ips',
    'ip_whitelist',
    'geo_whitelist',
    'whitelabel_config',
    'feature_flags',
    'mfa_settings',
    'webauthn_credentials',
    'password_reset_tokens',
    'email_verification_tokens',
    'active_sessions',
    'login_lockouts',
    'audit_config',
    'alert_thresholds'
  ];
BEGIN
  FOREACH t IN ARRAY critical LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = t AND relnamespace = 'public'::regnamespace) THEN
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END$$;