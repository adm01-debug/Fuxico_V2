
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop standalone BRIN indexes duplicados do particionado global
  FOR r IN
    SELECT i.relname AS idx_name
    FROM pg_class i
    JOIN pg_namespace n ON n.oid = i.relnamespace
    LEFT JOIN pg_inherits pi ON pi.inhrelid = i.oid
    WHERE n.nspname = 'public'
      AND i.relkind = 'i'
      AND i.relname LIKE '%_created_at_brin'
      AND pi.inhparent IS NULL  -- standalone
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.idx_name);
  END LOOP;

  -- Drop redundant unique-shadow indexes
  FOR r IN
    SELECT unnest(ARRAY[
      'idx_webhook_configs_user_id',
      'idx_webauthn_credentials_credential_id'
    ]) AS idx_name
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.idx_name);
  END LOOP;
END $$;
