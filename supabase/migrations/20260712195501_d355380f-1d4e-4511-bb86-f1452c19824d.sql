-- Generic audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION public.audit_sensitive_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_action text := TG_OP;
  v_old jsonb;
  v_new jsonb;
  v_target_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_target_id := COALESCE(v_old->>'id', '');
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_target_id := COALESCE(v_new->>'id', v_old->>'id', '');
  ELSE
    v_new := to_jsonb(NEW);
    v_target_id := COALESCE(v_new->>'id', '');
  END IF;

  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, metadata, created_at
  ) VALUES (
    v_actor,
    v_action,
    TG_TABLE_NAME,
    v_target_id,
    jsonb_build_object('old', v_old, 'new', v_new, 'schema', TG_TABLE_SCHEMA),
    now()
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Never block a business write because auditing failed
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to sensitive tables (idempotent)
DO $$
DECLARE
  t text;
  sensitive text[] := ARRAY[
    'user_roles',
    'role_permissions',
    'permissions',
    'gmail_configurations',
    'webhook_configs',
    'bitrix24_config',
    'whatsapp_configs',
    'feature_flags',
    'blocked_ips',
    'geo_whitelist',
    'ip_whitelist',
    'whitelabel_config'
  ];
BEGIN
  FOREACH t IN ARRAY sensitive LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = t AND relnamespace = 'public'::regnamespace) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit_%I
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change()',
        t, t
      );
    END IF;
  END LOOP;
END$$;