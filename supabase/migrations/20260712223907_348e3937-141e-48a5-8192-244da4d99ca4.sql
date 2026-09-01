
-- =============================================================================
-- Onda 46: Fluxo seguro de remoção de índices candidatos (admin_stale_indexes)
-- =============================================================================

-- 1) Tabela de auditoria/registro de tentativas de drop
CREATE TABLE IF NOT EXISTS public.stale_index_drops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_name TEXT NOT NULL DEFAULT 'public',
  table_name TEXT NOT NULL,
  index_name TEXT NOT NULL,
  index_size_bytes BIGINT,
  index_definition TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','dropped','restored','blocked','failed')),
  verdict JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dry_run BOOLEAN NOT NULL DEFAULT true,
  forced BOOLEAN NOT NULL DEFAULT false,
  dropped_at TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stale_index_drops_created ON public.stale_index_drops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stale_index_drops_status ON public.stale_index_drops(status);
CREATE INDEX IF NOT EXISTS idx_stale_index_drops_index_name ON public.stale_index_drops(index_name);

GRANT SELECT ON public.stale_index_drops TO authenticated;
GRANT ALL ON public.stale_index_drops TO service_role;

ALTER TABLE public.stale_index_drops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view stale index drops" ON public.stale_index_drops;
CREATE POLICY "Admins can view stale index drops"
  ON public.stale_index_drops
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_stale_index_drops_updated_at ON public.stale_index_drops;
CREATE TRIGGER update_stale_index_drops_updated_at
  BEFORE UPDATE ON public.stale_index_drops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Preview: verifica se o drop é seguro
CREATE OR REPLACE FUNCTION public.admin_preview_index_drop(_index_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema TEXT;
  v_table TEXT;
  v_indexdef TEXT;
  v_size BIGINT;
  v_is_unique BOOLEAN;
  v_is_primary BOOLEAN;
  v_supports_constraint BOOLEAN;
  v_scans_recent BIGINT;
  v_scans_total BIGINT;
  v_reason TEXT;
  v_safe BOOLEAN := true;
BEGIN
  SELECT n.nspname, c.relname, pg_get_indexdef(i.indexrelid),
         pg_relation_size(i.indexrelid), ix.indisunique, ix.indisprimary
    INTO v_schema, v_table, v_indexdef, v_size, v_is_unique, v_is_primary
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class c ON c.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE i.relname = _index_name
     AND n.nspname NOT IN ('pg_catalog','information_schema');

  IF v_schema IS NULL THEN
    RETURN jsonb_build_object('verdict','blocked','safe',false,'reason','index_not_found');
  END IF;

  -- Sustenta constraint?
  SELECT EXISTS(
    SELECT 1 FROM pg_constraint con
    JOIN pg_class ic ON ic.oid = con.conindid
    WHERE ic.relname = _index_name
  ) INTO v_supports_constraint;

  -- Scans recentes (últimos 7 dias) via snapshots
  SELECT COALESCE(SUM(idx_scan),0) INTO v_scans_recent
    FROM public.index_usage_snapshots
   WHERE index_name = _index_name
     AND snapshot_at >= now() - interval '7 days';

  SELECT COALESCE(s.idx_scan,0) INTO v_scans_total
    FROM pg_stat_user_indexes s
   WHERE s.indexrelname = _index_name
   LIMIT 1;

  IF v_is_primary THEN v_safe := false; v_reason := 'primary_key'; END IF;
  IF v_is_unique AND v_safe THEN v_safe := false; v_reason := 'unique_index'; END IF;
  IF v_supports_constraint AND v_safe THEN v_safe := false; v_reason := 'supports_constraint'; END IF;
  IF v_scans_recent > 0 AND v_safe THEN v_safe := false; v_reason := 'recent_scans'; END IF;

  RETURN jsonb_build_object(
    'verdict', CASE WHEN v_safe THEN 'safe' ELSE 'blocked' END,
    'safe', v_safe,
    'reason', v_reason,
    'schema_name', v_schema,
    'table_name', v_table,
    'index_name', _index_name,
    'index_definition', v_indexdef,
    'index_size_bytes', v_size,
    'is_unique', v_is_unique,
    'is_primary', v_is_primary,
    'supports_constraint', v_supports_constraint,
    'scans_recent_7d', v_scans_recent,
    'scans_total', v_scans_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_preview_index_drop(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_preview_index_drop(TEXT) TO service_role;

-- 3) Executa o drop com validação, dry-run e opção de force
CREATE OR REPLACE FUNCTION public.admin_execute_index_drop(
  _index_name TEXT,
  _dry_run BOOLEAN DEFAULT true,
  _force BOOLEAN DEFAULT false,
  _requested_by UUID DEFAULT NULL
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
  v_status TEXT;
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

  -- Bloqueios inegociáveis mesmo com force
  IF (v_preview->>'is_primary')::boolean OR (v_preview->>'supports_constraint')::boolean THEN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced)
    VALUES (v_schema, v_table, _index_name, v_size, COALESCE(v_def,''),
      'blocked', v_preview, v_reason, _requested_by, _dry_run, _force);

    RETURN jsonb_build_object('ok', false, 'error', 'hard_blocked', 'reason', v_reason, 'preview', v_preview);
  END IF;

  -- Bloqueios sanáveis com force
  IF NOT v_safe AND NOT _force THEN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced)
    VALUES (v_schema, v_table, _index_name, v_size, v_def,
      'blocked', v_preview, v_reason, _requested_by, _dry_run, _force);

    RETURN jsonb_build_object('ok', false, 'error', 'blocked', 'reason', v_reason, 'preview', v_preview);
  END IF;

  -- Dry-run: registra intenção sem executar
  IF _dry_run THEN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced)
    VALUES (v_schema, v_table, _index_name, v_size, v_def,
      'pending', v_preview, 'dry_run', _requested_by, true, _force)
    RETURNING id INTO v_drop_id;

    RETURN jsonb_build_object('ok', true, 'dry_run', true, 'drop_id', v_drop_id, 'preview', v_preview);
  END IF;

  -- Execução real: preserva definição, dropa e audita
  BEGIN
    INSERT INTO public.stale_index_drops(schema_name, table_name, index_name, index_size_bytes,
      index_definition, status, verdict, reason, requested_by, dry_run, forced, dropped_at)
    VALUES (v_schema, v_table, _index_name, v_size, v_def,
      'dropped', v_preview, v_reason, _requested_by, false, _force, now())
    RETURNING id INTO v_drop_id;

    EXECUTE format('DROP INDEX IF EXISTS %I.%I', v_schema, _index_name);

    PERFORM public.log_security_event(
      _requested_by, 'index_dropped', 'warning',
      format('Índice %s.%s removido (tamanho %s bytes, force=%s)', v_schema, _index_name, v_size, _force),
      NULL, NULL,
      jsonb_build_object('drop_id', v_drop_id, 'preview', v_preview)
    );

    RETURN jsonb_build_object('ok', true, 'dry_run', false, 'drop_id', v_drop_id, 'preview', v_preview);
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.stale_index_drops
       SET status = 'failed', reason = SQLERRM
     WHERE id = v_drop_id;

    PERFORM public.log_security_event(
      _requested_by, 'index_drop_failed', 'high',
      format('Falha ao dropar índice %s: %s', _index_name, SQLERRM),
      NULL, NULL,
      jsonb_build_object('drop_id', v_drop_id, 'preview', v_preview)
    );

    RETURN jsonb_build_object('ok', false, 'error', 'drop_failed', 'sqlerrm', SQLERRM, 'drop_id', v_drop_id);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_execute_index_drop(TEXT, BOOLEAN, BOOLEAN, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_execute_index_drop(TEXT, BOOLEAN, BOOLEAN, UUID) TO service_role;

-- 4) Restauração (rollback rápido)
CREATE OR REPLACE FUNCTION public.admin_restore_dropped_index(_drop_id UUID, _requested_by UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_def TEXT;
  v_index TEXT;
  v_status TEXT;
BEGIN
  SELECT index_definition, index_name, status
    INTO v_def, v_index, v_status
    FROM public.stale_index_drops
   WHERE id = _drop_id;

  IF v_def IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_status <> 'dropped' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_droppable_state', 'status', v_status);
  END IF;

  BEGIN
    EXECUTE v_def;

    UPDATE public.stale_index_drops
       SET status = 'restored', restored_at = now()
     WHERE id = _drop_id;

    PERFORM public.log_security_event(
      _requested_by, 'index_restored', 'info',
      format('Índice %s restaurado a partir do registro %s', v_index, _drop_id),
      NULL, NULL, jsonb_build_object('drop_id', _drop_id)
    );

    RETURN jsonb_build_object('ok', true, 'drop_id', _drop_id, 'index_name', v_index);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', 'restore_failed', 'sqlerrm', SQLERRM);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_restore_dropped_index(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_dropped_index(UUID, UUID) TO service_role;
