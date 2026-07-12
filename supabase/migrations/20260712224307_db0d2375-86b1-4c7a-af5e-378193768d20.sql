
CREATE OR REPLACE FUNCTION public.check_stagnant_indexes(
  _min_days INT DEFAULT 30,
  _min_size_mb INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_alerts_created INT := 0;
  v_admins_notified INT := 0;
  v_admin RECORD;
  v_min_size_bytes BIGINT := _min_size_mb * 1024 * 1024;
  v_today DATE := CURRENT_DATE;
  v_started TIMESTAMPTZ := now();
BEGIN
  IF NOT pg_try_advisory_lock(hashtext('check_stagnant_indexes')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_running');
  END IF;

  FOR v_rec IN
    WITH windowed AS (
      SELECT
        ius.schema_name,
        ius.table_name,
        ius.index_name,
        MAX(ius.idx_scan) - MIN(ius.idx_scan) AS period_scans,
        (SELECT index_size_bytes FROM public.index_usage_snapshots x
          WHERE x.index_name = ius.index_name ORDER BY snapshot_at DESC LIMIT 1) AS current_size_bytes,
        MIN(ius.snapshot_at) AS first_seen,
        MAX(ius.snapshot_at) AS last_seen
      FROM public.index_usage_snapshots ius
      WHERE ius.snapshot_at >= now() - make_interval(days => _min_days)
      GROUP BY ius.schema_name, ius.table_name, ius.index_name
      HAVING COUNT(*) >= 2
    )
    SELECT w.*
      FROM windowed w
     WHERE w.period_scans = 0
       AND w.current_size_bytes >= v_min_size_bytes
       -- não sustenta constraint / PK / unique
       AND NOT EXISTS (
         SELECT 1 FROM pg_index ix
         JOIN pg_class ic ON ic.oid = ix.indexrelid
         WHERE ic.relname = w.index_name
           AND (ix.indisunique OR ix.indisprimary)
       )
       AND NOT EXISTS (
         SELECT 1 FROM pg_constraint con
         JOIN pg_class ic ON ic.oid = con.conindid
         WHERE ic.relname = w.index_name
       )
       -- não duplicar alerta do mesmo índice no mesmo dia
       AND NOT EXISTS (
         SELECT 1 FROM public.security_events se
         WHERE se.event_type = 'stagnant_index_detected'
           AND se.metadata->>'index_name' = w.index_name
           AND se.created_at::date = v_today
       )
  LOOP
    -- 1) Security event
    PERFORM public.log_security_event(
      NULL,
      'stagnant_index_detected',
      'warning',
      format('Índice %s.%s ocioso há %s+ dias (%s MB) — candidato a remoção',
        v_rec.schema_name, v_rec.index_name, _min_days,
        round(v_rec.current_size_bytes / 1024.0 / 1024.0, 1)),
      NULL, NULL,
      jsonb_build_object(
        'schema_name', v_rec.schema_name,
        'table_name', v_rec.table_name,
        'index_name', v_rec.index_name,
        'size_bytes', v_rec.current_size_bytes,
        'days_stagnant', _min_days,
        'first_seen', v_rec.first_seen,
        'last_seen', v_rec.last_seen,
        'suggested_action', 'admin_execute_index_drop',
        'suggested_dry_run', true
      )
    );

    v_alerts_created := v_alerts_created + 1;

    -- 2) Notifica todos os admins
    FOR v_admin IN
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
    LOOP
      INSERT INTO public.notification_history (
        user_id, type, severity, title, message, metadata, is_read
      ) VALUES (
        v_admin.user_id,
        'stagnant_index',
        'warning',
        format('Índice ocioso: %s', v_rec.index_name),
        format(
          'O índice %I.%I na tabela %I está sem uso há %s+ dias e ocupa %s MB. '
          || 'Sugestão: execute um dry-run com admin_execute_index_drop e revise antes do DROP.',
          v_rec.schema_name, v_rec.index_name, v_rec.table_name, _min_days,
          round(v_rec.current_size_bytes / 1024.0 / 1024.0, 1)
        ),
        jsonb_build_object(
          'schema_name', v_rec.schema_name,
          'table_name', v_rec.table_name,
          'index_name', v_rec.index_name,
          'size_bytes', v_rec.current_size_bytes,
          'days_stagnant', _min_days,
          'suggested_action', 'admin_execute_index_drop',
          'suggested_args', jsonb_build_object('_index_name', v_rec.index_name, '_dry_run', true),
          'dashboard_route', '/admin/observability'
        ),
        false
      );
      v_admins_notified := v_admins_notified + 1;
    END LOOP;
  END LOOP;

  PERFORM pg_advisory_unlock(hashtext('check_stagnant_indexes'));

  RETURN jsonb_build_object(
    'ok', true,
    'alerts_created', v_alerts_created,
    'notifications_sent', v_admins_notified,
    'threshold_days', _min_days,
    'threshold_size_mb', _min_size_mb,
    'started_at', v_started,
    'finished_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_stagnant_indexes(INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_stagnant_indexes(INT, INT) TO service_role;

-- Cron job semanal (segunda 06:00 UTC)
DO $$
BEGIN
  PERFORM cron.unschedule('fuxico-stagnant-index-alerts')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fuxico-stagnant-index-alerts');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'fuxico-stagnant-index-alerts',
  '0 6 * * 1',
  $$SELECT public.check_stagnant_indexes(30, 10);$$
);
