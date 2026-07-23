CREATE OR REPLACE FUNCTION public.admin_webhook_circuit_dashboard()
RETURNS TABLE(
  webhook_id uuid,
  webhook_name text,
  webhook_url text,
  owner_user_id uuid,
  state text,
  consecutive_failures int,
  opened_at timestamptz,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  next_probe_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    cs.webhook_id,
    wc.name::text AS webhook_name,
    wc.url::text AS webhook_url,
    wc.user_id AS owner_user_id,
    cs.state,
    cs.consecutive_failures,
    cs.opened_at,
    cs.last_failure_at,
    cs.last_success_at,
    cs.next_probe_at,
    cs.updated_at
  FROM public.webhook_circuit_state cs
  LEFT JOIN public.webhook_configs wc ON wc.id = cs.webhook_id
  ORDER BY
    CASE cs.state WHEN 'open' THEN 0 WHEN 'half_open' THEN 1 ELSE 2 END,
    cs.consecutive_failures DESC,
    cs.updated_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_webhook_circuit_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_webhook_circuit_dashboard() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_reset_webhook_circuit(_webhook_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.webhook_circuit_state
     SET state = 'closed',
         consecutive_failures = 0,
         opened_at = NULL,
         next_probe_at = NULL,
         updated_at = now()
   WHERE webhook_id = _webhook_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  INSERT INTO public.security_events (event_type, severity, user_id, metadata)
  VALUES (
    'webhook_circuit_manual_reset',
    'medium',
    auth.uid(),
    jsonb_build_object('webhook_id', _webhook_id, 'rows_updated', v_updated)
  );

  RETURN jsonb_build_object('webhook_id', _webhook_id, 'reset', v_updated > 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_reset_webhook_circuit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_webhook_circuit(uuid) TO authenticated, service_role;