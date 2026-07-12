
-- Onda 44 — VACUUM ANALYZE proativo nas tabelas write-heavy
-- Autovacuum cuida do dia-a-dia, mas em tabelas com bursts de write o planner
-- pode ficar com estatísticas defasadas. Este job roda ANALYZE explícito nas
-- tabelas críticas + VACUUM (não FULL) em partições correntes.

CREATE OR REPLACE FUNCTION public.run_proactive_maintenance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz := clock_timestamp();
  v_tables text[] := ARRAY[
    'tracked_emails',
    'sequence_enrollments',
    'sequence_step_executions',
    'contact_scores',
    'domain_reputation',
    'scheduled_emails',
    'campaigns',
    'email_sequences',
    'notification_history',
    'follow_up_reminders'
  ];
  v_partition_parents text[] := ARRAY[
    'tracking_events',
    'webhook_logs',
    'audit_logs',
    'login_attempts',
    'rate_limit_logs',
    'security_events'
  ];
  v_table text;
  v_current_part text;
  v_month text := to_char(now(), 'YYYY_MM');
  v_analyzed int := 0;
  v_vacuumed int := 0;
  v_errors jsonb := '[]'::jsonb;
BEGIN
  IF NOT pg_try_advisory_lock(hashtextextended('proactive_maintenance', 0)) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'already_running');
  END IF;

  -- ANALYZE nas tabelas de negócio quentes
  FOREACH v_table IN ARRAY v_tables LOOP
    BEGIN
      EXECUTE format('ANALYZE public.%I', v_table);
      v_analyzed := v_analyzed + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('table', v_table, 'op', 'ANALYZE', 'err', SQLERRM);
    END;
  END LOOP;

  -- VACUUM ANALYZE na partição corrente de cada tabela particionada
  FOREACH v_table IN ARRAY v_partition_parents LOOP
    v_current_part := format('%s_%s', v_table, v_month);
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = v_current_part AND relkind = 'r') THEN
      BEGIN
        EXECUTE format('VACUUM (ANALYZE) public.%I', v_current_part);
        v_vacuumed := v_vacuumed + 1;
      EXCEPTION WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_object('table', v_current_part, 'op', 'VACUUM', 'err', SQLERRM);
      END;
    END IF;
  END LOOP;

  PERFORM pg_advisory_unlock(hashtextextended('proactive_maintenance', 0));

  -- Log em security_events se houve erros
  IF jsonb_array_length(v_errors) > 0 THEN
    PERFORM public.log_security_event(
      NULL,
      'proactive_maintenance_partial_failure',
      'medium',
      format('Manutenção proativa concluiu com %s erros', jsonb_array_length(v_errors)),
      NULL, NULL,
      jsonb_build_object('errors', v_errors)
    );
  END IF;

  RETURN jsonb_build_object(
    'started_at', v_start,
    'finished_at', clock_timestamp(),
    'duration_ms', EXTRACT(MILLISECOND FROM clock_timestamp() - v_start),
    'analyzed', v_analyzed,
    'vacuumed', v_vacuumed,
    'errors', v_errors
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_proactive_maintenance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_proactive_maintenance() TO service_role;

-- Agendamento diário 04:30 UTC (após retention cleanup 03:00 e tracking retention 03:30)
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'fuxico-proactive-maintenance';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
  PERFORM cron.schedule(
    'fuxico-proactive-maintenance',
    '30 4 * * *',
    $sql$SELECT public.run_proactive_maintenance();$sql$
  );
END $$;
