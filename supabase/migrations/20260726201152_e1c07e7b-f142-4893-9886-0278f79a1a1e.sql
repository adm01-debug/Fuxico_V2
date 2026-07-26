CREATE OR REPLACE FUNCTION public.reset_login_lockout(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_target text := lower(COALESCE(_email, ''));
BEGIN
  IF v_target = '' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_service_context()
     AND NOT (v_caller IS NOT NULL AND v_caller_email = v_target)
     AND NOT public.has_role(v_caller, 'admin'::app_role) THEN
    INSERT INTO public.security_events (event_type, severity, user_id, metadata)
    VALUES (
      'lockout_reset_denied',
      'high',
      v_caller,
      jsonb_build_object('target_email_hash', encode(extensions.digest(v_target, 'sha256'), 'hex'))
    );
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.login_lockouts WHERE lower(email) = v_target;
END;
$function$;