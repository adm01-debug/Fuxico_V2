
ALTER TABLE public.ab_tests
  ADD COLUMN IF NOT EXISTS stat_method TEXT NOT NULL DEFAULT 'ztest'
    CHECK (stat_method IN ('ztest','msprt'));

-- mSPRT: log-likelihood ratio for two proportions with mixture prior tau^2.
-- Reject H0 (no diff) when |LLR| > log(1/alpha). Alpha-spending safe under continuous monitoring.
CREATE OR REPLACE FUNCTION public.compute_sprt_boundary(
  _n_a INT, _x_a INT,
  _n_b INT, _x_b INT,
  _alpha NUMERIC DEFAULT 0.05,
  _tau2 NUMERIC DEFAULT 0.0025
) RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  p_a NUMERIC;
  p_b NUMERIC;
  p_pool NUMERIC;
  se NUMERIC;
  z NUMERIC;
  llr NUMERIC;
  boundary NUMERIC;
  n_total INT;
  reject BOOLEAN := FALSE;
  winner TEXT := NULL;
BEGIN
  IF _n_a < 30 OR _n_b < 30 THEN
    RETURN jsonb_build_object('reject', false, 'winner', null, 'llr', 0, 'boundary', 0, 'reason', 'insufficient_sample');
  END IF;
  p_a := _x_a::NUMERIC / _n_a;
  p_b := _x_b::NUMERIC / _n_b;
  n_total := _n_a + _n_b;
  p_pool := (_x_a + _x_b)::NUMERIC / n_total;
  se := sqrt(p_pool * (1 - p_pool) * (1.0/_n_a + 1.0/_n_b));
  IF se = 0 THEN
    RETURN jsonb_build_object('reject', false, 'winner', null, 'llr', 0, 'boundary', 0, 'reason', 'zero_variance');
  END IF;
  z := (p_a - p_b) / se;
  -- mixture SPRT log-likelihood ratio for Gaussian approximation.
  llr := 0.5 * ln( 1.0 / (1.0 + n_total * _tau2) )
       + ( (n_total * _tau2) / (2.0 * (1.0 + n_total * _tau2)) ) * (z * z);
  boundary := ln(1.0 / _alpha);
  IF llr > boundary THEN
    reject := TRUE;
    winner := CASE WHEN p_a > p_b THEN 'A' ELSE 'B' END;
  END IF;
  RETURN jsonb_build_object(
    'reject', reject,
    'winner', winner,
    'llr', llr,
    'boundary', boundary,
    'z', z,
    'p_a', p_a,
    'p_b', p_b
  );
END;
$$;

REVOKE ALL ON FUNCTION public.compute_sprt_boundary(INT, INT, INT, INT, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_sprt_boundary(INT, INT, INT, INT, NUMERIC, NUMERIC) TO authenticated, service_role;
