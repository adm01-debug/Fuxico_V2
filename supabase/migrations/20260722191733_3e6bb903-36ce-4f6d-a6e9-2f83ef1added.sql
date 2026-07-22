CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.mfa_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user ON public.mfa_backup_codes(user_id) WHERE used_at IS NULL;

GRANT SELECT ON public.mfa_backup_codes TO authenticated;
GRANT ALL ON public.mfa_backup_codes TO service_role;

ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own backup codes read" ON public.mfa_backup_codes;
CREATE POLICY "own backup codes read" ON public.mfa_backup_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.generate_mfa_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_codes text[] := ARRAY[]::text[];
  v_code text;
  i int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.mfa_backup_codes WHERE user_id = v_uid;

  FOR i IN 1..10 LOOP
    v_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 10));
    v_code := substr(v_code,1,5) || '-' || substr(v_code,6,5);
    v_codes := array_append(v_codes, v_code);
    INSERT INTO public.mfa_backup_codes (user_id, code_hash)
    VALUES (v_uid, extensions.crypt(v_code, extensions.gen_salt('bf', 10)));
  END LOOP;

  PERFORM public.log_security_event(
    v_uid, 'mfa_backup_codes_regenerated', 'info',
    'Códigos de backup MFA regenerados', NULL, NULL, '{}'::jsonb
  );

  RETURN v_codes;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_mfa_backup_codes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_mfa_backup_codes() TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_mfa_backup_code(_user_id uuid, _code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  r RECORD;
BEGIN
  IF _user_id IS NULL OR _code IS NULL OR length(_code) < 4 THEN
    RETURN false;
  END IF;

  FOR r IN
    SELECT id, code_hash
      FROM public.mfa_backup_codes
     WHERE user_id = _user_id
       AND used_at IS NULL
     FOR UPDATE SKIP LOCKED
  LOOP
    IF r.code_hash = extensions.crypt(_code, r.code_hash) THEN
      UPDATE public.mfa_backup_codes SET used_at = now() WHERE id = r.id;
      PERFORM public.log_security_event(
        _user_id, 'mfa_backup_code_consumed', 'warning',
        'Código de backup MFA utilizado', NULL, NULL, '{}'::jsonb
      );
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_mfa_backup_code(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_mfa_backup_code(uuid, text) TO service_role;