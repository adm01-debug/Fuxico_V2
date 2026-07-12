-- Onda 39: RPC pública para consumo da agregação mensal

CREATE OR REPLACE FUNCTION public.get_tracking_monthly_stats(
  _user_id uuid,
  _months integer DEFAULT 12
)
RETURNS TABLE(
  month date,
  event_type text,
  event_count bigint,
  distinct_ips bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF _months < 1 OR _months > 60 THEN
    RAISE EXCEPTION 'months out of range (1..60)' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    agg.month,
    agg.event_type,
    SUM(agg.event_count)::bigint,
    SUM(agg.distinct_ips)::bigint
  FROM public.tracking_events_monthly_agg agg
  INNER JOIN public.tracked_emails te ON te.tracking_id = agg.tracking_id
  WHERE te.user_id = _user_id
    AND agg.month >= (date_trunc('month', now()) - (_months || ' months')::interval)::date
  GROUP BY agg.month, agg.event_type
  ORDER BY agg.month DESC, agg.event_type;
END;
$$;

REVOKE ALL ON FUNCTION public.get_tracking_monthly_stats(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tracking_monthly_stats(uuid, integer) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_tracking_monthly_stats(uuid, integer) IS
  'Retorna agregação mensal de tracking events do usuário chamador (Onda 39). Enforce auth.uid()=_user_id.';