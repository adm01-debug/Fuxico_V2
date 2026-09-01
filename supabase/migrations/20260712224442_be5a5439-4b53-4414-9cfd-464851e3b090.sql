
-- 1) Tabela de análise
CREATE TABLE IF NOT EXISTS public.index_drop_impact_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  index_name TEXT NOT NULL,
  schema_name TEXT NOT NULL DEFAULT 'public',
  table_name TEXT NOT NULL,
  queries JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{queryid, query, calls, mean_ms, baseline_cost, post_cost, delta_pct, baseline_plan, post_plan, error?}]
  baseline_captured_at TIMESTAMPTZ,
  post_captured_at TIMESTAMPTZ,
  baseline_total_cost NUMERIC,
  post_total_cost NUMERIC,
  verdict TEXT CHECK (verdict IN ('improved','neutral','regressed','mixed','pending','failed')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','pending_drop','completed','failed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_index_drop_impact_created ON public.index_drop_impact_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_index_drop_impact_status ON public.index_drop_impact_analysis(status);
CREATE INDEX IF NOT EXISTS idx_index_drop_impact_index_name ON public.index_drop_impact_analysis(index_name);

GRANT SELECT ON public.index_drop_impact_analysis TO authenticated;
GRANT ALL ON public.index_drop_impact_analysis TO service_role;

ALTER TABLE public.index_drop_impact_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view index drop impact" ON public.index_drop_impact_analysis;
CREATE POLICY "Admins can view index drop impact"
  ON public.index_drop_impact_analysis
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_index_drop_impact_updated_at ON public.index_drop_impact_analysis;
CREATE TRIGGER update_index_drop_impact_updated_at
  BEFORE UPDATE ON public.index_drop_impact_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vincular análise ao registro de drop
ALTER TABLE public.stale_index_drops
  ADD COLUMN IF NOT EXISTS impact_analysis_id UUID REFERENCES public.index_drop_impact_analysis(id) ON DELETE SET NULL;

-- 2) Captura de baseline
CREATE OR REPLACE FUNCTION public.analyze_index_pre_drop(_index_name TEXT, _top_n INT DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema TEXT;
  v_table TEXT;
  v_analysis_id UUID;
  v_row RECORD;
  v_plan JSONB;
  v_cost NUMERIC;
  v_total_cost NUMERIC := 0;
  v_queries JSONB := '[]'::jsonb;
  v_error TEXT;
BEGIN
  SELECT n.nspname, c.relname INTO v_schema, v_table
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class c ON c.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE i.relname = _index_name
   LIMIT 1;

  IF v_schema IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'index_not_found');
  END IF;

  INSERT INTO public.index_drop_impact_analysis(index_name, schema_name, table_name, status, verdict)
  VALUES (_index_name, v_schema, v_table, 'pending', 'pending')
  RETURNING id INTO v_analysis_id;

  -- Top queries que referenciam a tabela em pg_stat_statements
  FOR v_row IN
    SELECT queryid, query, calls, mean_exec_time, total_exec_time
      FROM pg_stat_statements
     WHERE query ILIKE '%' || v_table || '%'
       AND query NOT ILIKE '%pg_stat_statements%'
       AND query NOT ILIKE '%EXPLAIN%'
     ORDER BY total_exec_time DESC
     LIMIT _top_n
  LOOP
    v_error := NULL;
    v_plan := NULL;
    v_cost := NULL;

    BEGIN
      -- EXPLAIN GENERIC_PLAN (PG16+) permite planos sem valores reais dos placeholders $1..$N
      EXECUTE format('EXPLAIN (GENERIC_PLAN, FORMAT JSON) %s', v_row.query)
        INTO v_plan;
      v_cost := COALESCE((v_plan->0->'Plan'->>'Total Cost')::numeric, 0);
      v_total_cost := v_total_cost + v_cost;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
    END;

    v_queries := v_queries || jsonb_build_object(
      'queryid', v_row.queryid::text,
      'query', left(v_row.query, 4000),
      'calls', v_row.calls,
      'mean_ms', round(v_row.mean_exec_time::numeric, 2),
      'baseline_cost', v_cost,
      'baseline_plan', v_plan,
      'error', v_error
    );
  END LOOP;

  UPDATE public.index_drop_impact_analysis
     SET queries = v_queries,
         baseline_captured_at = now(),
         baseline_total_cost = v_total_cost,
         status = 'pending_drop'
   WHERE id = v_analysis_id;

  RETURN jsonb_build_object(
    'ok', true,
    'analysis_id', v_analysis_id,
    'schema_name', v_schema,
    'table_name', v_table,
    'queries_captured', jsonb_array_length(v_queries),
    'baseline_total_cost', v_total_cost
  );
END;
$$;

REVOKE ALL ON FUNCTION public.analyze_index_pre_drop(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_index_pre_drop(TEXT, INT) TO service_role;

-- 3) Captura pós-drop + verdict
CREATE OR REPLACE FUNCTION public.analyze_index_post_drop(_analysis_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_q JSONB;
  v_new_queries JSONB := '[]'::jsonb;
  v_post_plan JSONB;
  v_post_cost NUMERIC;
  v_baseline_cost NUMERIC;
  v_total_post NUMERIC := 0;
  v_delta_pct NUMERIC;
  v_error TEXT;
  v_improved INT := 0;
  v_regressed INT := 0;
  v_neutral INT := 0;
  v_verdict TEXT;
BEGIN
  SELECT * INTO v_rec FROM public.index_drop_impact_analysis WHERE id = _analysis_id;
  IF v_rec.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'analysis_not_found');
  END IF;
  IF v_rec.status <> 'pending_drop' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status', 'status', v_rec.status);
  END IF;

  FOR v_q IN SELECT * FROM jsonb_array_elements(v_rec.queries)
  LOOP
    v_error := NULL;
    v_post_plan := NULL;
    v_post_cost := NULL;
    v_baseline_cost := (v_q->>'baseline_cost')::numeric;
    v_delta_pct := NULL;

    BEGIN
      EXECUTE format('EXPLAIN (GENERIC_PLAN, FORMAT JSON) %s', v_q->>'query')
        INTO v_post_plan;
      v_post_cost := COALESCE((v_post_plan->0->'Plan'->>'Total Cost')::numeric, 0);
      v_total_post := v_total_post + v_post_cost;

      IF v_baseline_cost IS NOT NULL AND v_baseline_cost > 0 THEN
        v_delta_pct := round(((v_post_cost - v_baseline_cost) / v_baseline_cost) * 100, 2);
        IF v_delta_pct > 10 THEN v_regressed := v_regressed + 1;
        ELSIF v_delta_pct < -10 THEN v_improved := v_improved + 1;
        ELSE v_neutral := v_neutral + 1;
        END IF;
      ELSE
        v_neutral := v_neutral + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
    END;

    v_new_queries := v_new_queries || (v_q || jsonb_build_object(
      'post_cost', v_post_cost,
      'post_plan', v_post_plan,
      'delta_pct', v_delta_pct,
      'post_error', v_error
    ));
  END LOOP;

  v_verdict := CASE
    WHEN v_regressed > 0 AND v_improved = 0 THEN 'regressed'
    WHEN v_regressed = 0 AND v_improved > 0 THEN 'improved'
    WHEN v_regressed > 0 AND v_improved > 0 THEN 'mixed'
    ELSE 'neutral'
  END;

  UPDATE public.index_drop_impact_analysis
     SET queries = v_new_queries,
         post_captured_at = now(),
         post_total_cost = v_total_post,
         verdict = v_verdict,
         status = 'completed',
         notes = format('improved=%s neutral=%s regressed=%s', v_improved, v_neutral, v_regressed)
   WHERE id = _analysis_id;

  -- Alerta se regressão detectada
  IF v_verdict IN ('regressed','mixed') THEN
    PERFORM public.log_security_event(
      NULL, 'index_drop_regression_detected', 'high',
      format('DROP do índice %s causou regressão em queries top-N (verdict=%s)', v_rec.index_name, v_verdict),
      NULL, NULL,
      jsonb_build_object('analysis_id', _analysis_id, 'index_name', v_rec.index_name,
        'baseline_cost', v_rec.baseline_total_cost, 'post_cost', v_total_post,
        'improved', v_improved, 'regressed', v_regressed, 'neutral', v_neutral)
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'analysis_id', _analysis_id,
    'verdict', v_verdict,
    'baseline_total_cost', v_rec.baseline_total_cost,
    'post_total_cost', v_total_post,
    'improved', v_improved,
    'regressed', v_regressed,
    'neutral', v_neutral
  );
END;
$$;

REVOKE ALL ON FUNCTION public.analyze_index_post_drop(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_index_post_drop(UUID) TO service_role;

-- 4) Estende admin_execute_index_drop para orquestrar baseline + pós
CREATE OR REPLACE FUNCTION public.admin_execute_index_drop(
  _index_name TEXT,
  _dry_run BOOLEAN DEFAULT true,
  _force BOOLEAN DEFAULT false,
  _requested_by UUID DEFAULT NULL,
  _capture_baseline BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preview JSONB;
  v_safe BOOLEAN;
  v_reason TEXT;
  v_drop_id UUID;
  v_schema TEXT;
  v_table TEXT;
  v_def TEXT;
  v_size BIGINT;
  v_baseline JSONB;
  v_analysis_id UUID;
  v_post JSONB;
BEGIN
  v_preview := public.admin_preview_index_drop(_index_name);
  v_safe := (v_preview->>'safe')::boolean;
  v_reason := v_preview->>'reason';
  v_schema := v_preview->>'schema_name';
  v_table := v_preview->>'table_name';
  v_def := v_preview->>'index_definition';
  v_size := (v_preview->>'index_size_bytes')::bigint;

  IF v_schema IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'index_not_found', 'preview', v_preview);
  END IF;

  IF (v_preview->>'is_primary')::boolean OR (v_preview->>'supports_constraint')::boolean THEN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced)
    VALUES (v_schema, v_table, _index_name, v_size, COALESCE(v_def,''),
      'blocked', v_preview, v_reason, _requested_by, _dry_run, _force);
    RETURN jsonb_build_object('ok', false, 'error', 'hard_blocked', 'reason', v_reason, 'preview', v_preview);
  END IF;

  IF NOT v_safe AND NOT _force THEN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced)
    VALUES (v_schema, v_table, _index_name, v_size, v_def,
      'blocked', v_preview, v_reason, _requested_by, _dry_run, _force);
    RETURN jsonb_build_object('ok', false, 'error', 'blocked', 'reason', v_reason, 'preview', v_preview);
  END IF;

  -- Baseline EXPLAIN
  IF _capture_baseline THEN
    v_baseline := public.analyze_index_pre_drop(_index_name, 10);
    IF (v_baseline->>'ok')::boolean THEN
      v_analysis_id := (v_baseline->>'analysis_id')::uuid;
    END IF;
  END IF;

  -- Dry-run: registra intenção com baseline
  IF _dry_run THEN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced, impact_analysis_id)
    VALUES (v_schema, v_table, _index_name, v_size, v_def,
      'pending', v_preview, 'dry_run', _requested_by, true, _force, v_analysis_id)
    RETURNING id INTO v_drop_id;
    RETURN jsonb_build_object('ok', true, 'dry_run', true, 'drop_id', v_drop_id,
      'preview', v_preview, 'baseline', v_baseline);
  END IF;

  -- Execução real
  BEGIN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced, dropped_at, impact_analysis_id)
    VALUES (v_schema, v_table, _index_name, v_size, v_def,
      'dropped', v_preview, v_reason, _requested_by, false, _force, now(), v_analysis_id)
    RETURNING id INTO v_drop_id;

    EXECUTE format('DROP INDEX IF EXISTS %I.%I', v_schema, _index_name);

    IF v_analysis_id IS NOT NULL THEN
      v_post := public.analyze_index_post_drop(v_analysis_id);
    END IF;

    PERFORM public.log_security_event(
      _requested_by, 'index_dropped', 'warning',
      format('Índice %s.%s removido (%s bytes) — verdict %s',
        v_schema, _index_name, v_size, COALESCE(v_post->>'verdict','n/a')),
      NULL, NULL,
      jsonb_build_object('drop_id', v_drop_id, 'preview', v_preview,
        'analysis_id', v_analysis_id, 'post', v_post)
    );

    RETURN jsonb_build_object('ok', true, 'dry_run', false, 'drop_id', v_drop_id,
      'preview', v_preview, 'analysis_id', v_analysis_id, 'post', v_post);
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.stale_index_drops SET status='failed', reason=SQLERRM WHERE id = v_drop_id;
    RETURN jsonb_build_object('ok', false, 'error', 'drop_failed', 'sqlerrm', SQLERRM, 'drop_id', v_drop_id);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_execute_index_drop(TEXT, BOOLEAN, BOOLEAN, UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_execute_index_drop(TEXT, BOOLEAN, BOOLEAN, UUID, BOOLEAN) TO service_role;
