
-- Função executora do advisor + registro em security_events
CREATE OR REPLACE FUNCTION public.run_index_advisor_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_high_count INT := 0;
  v_medium_count INT := 0;
  v_details jsonb := '[]'::jsonb;
BEGIN
  FOR v_rec IN
    SELECT * FROM public.admin_index_advisor(1000)
    WHERE recommendation IN ('HIGH','MEDIUM')
  LOOP
    IF v_rec.recommendation = 'HIGH' THEN
      v_high_count := v_high_count + 1;
      PERFORM public.log_security_event(
        NULL,
        'index_advisor_high',
        'medium',
        format('Tabela %s: %s scans sequenciais sem uso de índice', v_rec.table_name, v_rec.seq_scans)
      );
    ELSIF v_rec.recommendation = 'MEDIUM' AND v_rec.live_tuples > 100000 THEN
      v_medium_count := v_medium_count + 1;
    END IF;

    v_details := v_details || jsonb_build_object(
      'table', v_rec.table_name,
      'recommendation', v_rec.recommendation,
      'seq_scans', v_rec.seq_scans,
      'idx_scans', v_rec.idx_scans,
      'live_tuples', v_rec.live_tuples,
      'hint', v_rec.hint
    );
  END LOOP;

  RETURN jsonb_build_object(
    'ran_at', now(),
    'high_count', v_high_count,
    'medium_count', v_medium_count,
    'details', v_details
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_index_advisor_check() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.run_index_advisor_check() TO authenticated, service_role;

-- Agendar cron diário (03:15 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('daily-index-advisor')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-index-advisor');

    PERFORM cron.schedule(
      'daily-index-advisor',
      '15 3 * * *',
      $cron$ SELECT public.run_index_advisor_check(); $cron$
    );
  END IF;
END;
$$;
