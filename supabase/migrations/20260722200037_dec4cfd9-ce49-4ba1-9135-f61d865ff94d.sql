
CREATE OR REPLACE FUNCTION public.compute_adaptive_limit(
  _ip TEXT,
  _user_id UUID,
  _base_limit INT
) RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  multiplier NUMERIC := 1.0;
  ip_bad_events INT := 0;
  avg_score NUMERIC := 0;
BEGIN
  IF _ip IS NOT NULL AND _ip <> 'unknown' THEN
    SELECT COUNT(*) INTO ip_bad_events
      FROM public.security_events
      WHERE ip_address = _ip::inet
        AND severity IN ('high','critical')
        AND created_at > now() - interval '1 hour';
    IF ip_bad_events >= 3 THEN
      multiplier := multiplier * 0.25;
    ELSIF ip_bad_events >= 1 THEN
      multiplier := multiplier * 0.5;
    END IF;
  END IF;

  IF _user_id IS NOT NULL THEN
    SELECT COALESCE(AVG(engagement_score), 0) INTO avg_score
      FROM public.contact_scores
      WHERE user_id = _user_id;
    IF avg_score >= 70 THEN
      multiplier := multiplier * 2.0;
    ELSIF avg_score >= 40 THEN
      multiplier := multiplier * 1.5;
    END IF;
  END IF;

  RETURN GREATEST(1, FLOOR(_base_limit * multiplier))::INT;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_adaptive_limit(TEXT, UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_adaptive_limit(TEXT, UUID, INT) TO service_role;
