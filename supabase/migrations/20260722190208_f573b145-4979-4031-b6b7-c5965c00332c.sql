
-- === 1) Novas colunas em ab_tests (idempotente) ===
ALTER TABLE public.ab_tests
  ADD COLUMN IF NOT EXISTS variant_a_body TEXT,
  ADD COLUMN IF NOT EXISTS variant_b_body TEXT,
  ADD COLUMN IF NOT EXISTS segment_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS holdout_percent INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS auto_promote BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS winner_promoted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS min_sample_size INT NOT NULL DEFAULT 30;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ab_tests_holdout_percent_check'
  ) THEN
    ALTER TABLE public.ab_tests
      ADD CONSTRAINT ab_tests_holdout_percent_check
      CHECK (holdout_percent BETWEEN 0 AND 50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ab_tests_min_sample_size_check'
  ) THEN
    ALTER TABLE public.ab_tests
      ADD CONSTRAINT ab_tests_min_sample_size_check
      CHECK (min_sample_size BETWEEN 10 AND 10000);
  END IF;
END $$;

-- === 2) RPC atômica para incrementar métricas ===
CREATE OR REPLACE FUNCTION public.increment_ab_metrics(
  p_id UUID,
  p_variant TEXT,
  p_sends INT DEFAULT 0,
  p_opens INT DEFAULT 0,
  p_clicks INT DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.ab_tests WHERE id = p_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'ab_test_not_found' USING ERRCODE = '42704';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> v_owner THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_variant NOT IN ('A','B') THEN
    RAISE EXCEPTION 'invalid_variant' USING ERRCODE = '22023';
  END IF;
  IF p_sends < 0 OR p_opens < 0 OR p_clicks < 0 THEN
    RAISE EXCEPTION 'negative_delta' USING ERRCODE = '22023';
  END IF;

  IF p_variant = 'A' THEN
    UPDATE public.ab_tests
      SET variant_a_sends = variant_a_sends + p_sends,
          variant_a_opens = variant_a_opens + p_opens,
          variant_a_clicks = variant_a_clicks + p_clicks,
          updated_at = now()
      WHERE id = p_id;
  ELSE
    UPDATE public.ab_tests
      SET variant_b_sends = variant_b_sends + p_sends,
          variant_b_opens = variant_b_opens + p_opens,
          variant_b_clicks = variant_b_clicks + p_clicks,
          updated_at = now()
      WHERE id = p_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ab_metrics(uuid,text,int,int,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_ab_metrics(uuid,text,int,int,int) TO authenticated, service_role;

-- === 3) RPC de prévia de segmento comportamental ===
CREATE OR REPLACE FUNCTION public.preview_ab_segment(
  p_user_id UUID,
  p_filters JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE(recipient_email TEXT, engagement_score INT, score_level TEXT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '3s'
AS $$
DECLARE
  v_min_score INT := COALESCE((p_filters->>'min_score')::int, 0);
  v_last_open_days INT := (p_filters->>'last_open_days')::int;
  v_levels TEXT[] := CASE
    WHEN jsonb_typeof(p_filters->'score_levels') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(p_filters->'score_levels'))
    ELSE NULL
  END;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cs.email, cs.engagement_score, cs.score_level
    FROM public.contact_scores cs
   WHERE cs.user_id = p_user_id
     AND cs.engagement_score >= v_min_score
     AND (v_levels IS NULL OR cs.score_level = ANY(v_levels))
     AND (v_last_open_days IS NULL OR cs.last_interaction_at >= now() - make_interval(days => v_last_open_days))
   ORDER BY cs.engagement_score DESC
   LIMIT 5000;
END;
$$;

REVOKE ALL ON FUNCTION public.preview_ab_segment(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_ab_segment(uuid,jsonb) TO authenticated, service_role;

-- === 4) Auto-promoção do vencedor ===
CREATE OR REPLACE FUNCTION public.auto_promote_ab_winners()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  v_rate_a NUMERIC;
  v_rate_b NUMERIC;
  v_pooled NUMERIC;
  v_se NUMERIC;
  v_z NUMERIC;
  v_winner TEXT;
  v_promoted INT := 0;
  v_evaluated INT := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.ab_tests
     WHERE status = 'running'
       AND auto_promote = true
       AND winner IS NULL
  LOOP
    v_evaluated := v_evaluated + 1;
    IF r.variant_a_sends < r.min_sample_size OR r.variant_b_sends < r.min_sample_size THEN
      CONTINUE;
    END IF;

    v_rate_a := r.variant_a_opens::numeric / NULLIF(r.variant_a_sends,0);
    v_rate_b := r.variant_b_opens::numeric / NULLIF(r.variant_b_sends,0);
    v_pooled := (r.variant_a_opens + r.variant_b_opens)::numeric
                / NULLIF((r.variant_a_sends + r.variant_b_sends), 0);
    v_se := sqrt(v_pooled * (1 - v_pooled) * (1.0/r.variant_a_sends + 1.0/r.variant_b_sends));
    IF v_se IS NULL OR v_se = 0 THEN CONTINUE; END IF;

    v_z := abs(v_rate_a - v_rate_b) / v_se;
    IF v_z <= 1.96 THEN CONTINUE; END IF;

    v_winner := CASE WHEN v_rate_a > v_rate_b THEN 'A' ELSE 'B' END;

    UPDATE public.ab_tests
       SET winner = v_winner,
           status = 'completed',
           completed_at = now(),
           winner_promoted_at = now(),
           updated_at = now()
     WHERE id = r.id;

    INSERT INTO public.security_events (user_id, event_type, severity, description, metadata)
    VALUES (
      r.user_id,
      'ab_test_auto_promoted',
      'info',
      format('Teste A/B %s: vencedor %s promovido automaticamente (z=%s)',
             r.name, v_winner, round(v_z, 2)),
      jsonb_build_object(
        'ab_test_id', r.id,
        'winner', v_winner,
        'z_score', round(v_z, 4),
        'rate_a', round(v_rate_a, 4),
        'rate_b', round(v_rate_b, 4),
        'sends_a', r.variant_a_sends,
        'sends_b', r.variant_b_sends
      )
    );

    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'evaluated', v_evaluated,
    'promoted', v_promoted,
    'ran_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.auto_promote_ab_winners() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_promote_ab_winners() TO service_role;

-- === 5) Cron: a cada 15 minutos ===
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ab-test-auto-promote') THEN
    PERFORM cron.unschedule('ab-test-auto-promote');
  END IF;
  PERFORM cron.schedule(
    'ab-test-auto-promote',
    '*/15 * * * *',
    $cron$ SELECT public.auto_promote_ab_winners(); $cron$
  );
END $$;

-- === 6) Índice de suporte para o cron ===
CREATE INDEX IF NOT EXISTS idx_ab_tests_running_auto_promote
  ON public.ab_tests (status)
  WHERE status = 'running' AND auto_promote = true AND winner IS NULL;
