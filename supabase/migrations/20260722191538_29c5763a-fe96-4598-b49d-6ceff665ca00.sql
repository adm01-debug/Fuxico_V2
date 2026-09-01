CREATE OR REPLACE FUNCTION public.promote_ab_winner(_test_id uuid, _winner text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t RECORD;
  v_template_id uuid;
BEGIN
  IF _winner NOT IN ('A','B') THEN
    RAISE EXCEPTION 'invalid_winner' USING ERRCODE = '22023';
  END IF;

  -- Lock exclusivo, ignora testes já em promoção
  SELECT * INTO t
  FROM public.ab_tests
  WHERE id = _test_id
    AND winner_promoted_at IS NULL
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_promoted_or_locked');
  END IF;

  INSERT INTO public.email_templates (user_id, name, subject, body, category)
  VALUES (
    t.user_id,
    format('A/B Vencedor: %s (Variante %s)', LEFT(t.name, 60), _winner),
    CASE WHEN _winner = 'A' THEN t.variant_a_subject ELSE t.variant_b_subject END,
    COALESCE(CASE WHEN _winner = 'A' THEN t.variant_a_body ELSE t.variant_b_body END, ''),
    'A/B Winners'
  )
  RETURNING id INTO v_template_id;

  UPDATE public.ab_tests
     SET winner = _winner,
         status = 'completed',
         winner_promoted_at = now(),
         completed_at = COALESCE(completed_at, now())
   WHERE id = _test_id;

  INSERT INTO public.notification_history (
    user_id, type, severity, title, message, metadata, is_read
  ) VALUES (
    t.user_id,
    'ab_winner_promoted',
    'success',
    format('Variante %s vencedora promovida', _winner),
    format('O teste A/B "%s" foi concluído. A variante %s foi salva como template.', t.name, _winner),
    jsonb_build_object('ab_test_id', _test_id, 'winner', _winner, 'template_id', v_template_id),
    false
  );

  RETURN jsonb_build_object('ok', true, 'template_id', v_template_id, 'winner', _winner);
END;
$$;

REVOKE ALL ON FUNCTION public.promote_ab_winner(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_ab_winner(uuid, text) TO authenticated, service_role;

-- Cron helper: aplica Z-test 95% em todos os testes rodando com auto_promote
CREATE OR REPLACE FUNCTION public.admin_auto_promote_ab_winners()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_rate_a numeric;
  v_rate_b numeric;
  v_pooled numeric;
  v_se numeric;
  v_z numeric;
  v_winner text;
  v_promoted int := 0;
  v_result jsonb;
BEGIN
  FOR r IN
    SELECT id, variant_a_sends, variant_b_sends, variant_a_opens, variant_b_opens, min_sample_size
      FROM public.ab_tests
     WHERE status = 'running'
       AND winner IS NULL
       AND auto_promote = true
       AND winner_promoted_at IS NULL
     FOR UPDATE SKIP LOCKED
  LOOP
    IF r.variant_a_sends < r.min_sample_size OR r.variant_b_sends < r.min_sample_size THEN
      CONTINUE;
    END IF;

    v_rate_a := r.variant_a_opens::numeric / GREATEST(r.variant_a_sends, 1);
    v_rate_b := r.variant_b_opens::numeric / GREATEST(r.variant_b_sends, 1);
    v_pooled := (r.variant_a_opens + r.variant_b_opens)::numeric
                / GREATEST(r.variant_a_sends + r.variant_b_sends, 1);
    v_se := sqrt(v_pooled * (1 - v_pooled)
                 * (1.0 / GREATEST(r.variant_a_sends, 1)
                    + 1.0 / GREATEST(r.variant_b_sends, 1)));

    IF v_se = 0 THEN CONTINUE; END IF;

    v_z := abs(v_rate_a - v_rate_b) / v_se;
    IF v_z < 1.96 THEN CONTINUE; END IF;

    v_winner := CASE WHEN v_rate_a > v_rate_b THEN 'A' ELSE 'B' END;
    v_result := public.promote_ab_winner(r.id, v_winner);
    IF (v_result->>'ok')::boolean THEN
      v_promoted := v_promoted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'promoted', v_promoted, 'ran_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.admin_auto_promote_ab_winners() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_auto_promote_ab_winners() TO service_role;