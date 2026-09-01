
-- ONDA 19 — Auto-alertas de regressão + limpeza de snapshots + bloat monitor

CREATE OR REPLACE FUNCTION public.alert_query_regressions()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    WITH current_window AS (
      SELECT queryid, AVG(mean_exec_ms) AS cur_mean, MAX(query_text) AS q, SUM(calls) AS cur_calls
      FROM public.query_performance_snapshots
      WHERE snapshot_at >= now() - interval '1 hour'
      GROUP BY queryid
    ),
    baseline AS (
      SELECT queryid, AVG(mean_exec_ms) AS base_mean
      FROM public.query_performance_snapshots
      WHERE snapshot_at BETWEEN now() - interval '25 hours' AND now() - interval '1 hour'
      GROUP BY queryid
    )
    SELECT
      c.queryid,
      LEFT(c.q, 300) AS query_text,
      ROUND(c.cur_mean, 2) AS cur_mean,
      ROUND(b.base_mean, 2) AS base_mean,
      ROUND(((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) * 100, 2) AS regression_pct,
      c.cur_calls
    FROM current_window c
    JOIN baseline b ON b.queryid = c.queryid
    WHERE b.base_mean > 5
      AND ((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) * 100 >= 100
  LOOP
    -- Deduplicação: só registra se não houver alerta idêntico na última hora
    IF NOT EXISTS (
      SELECT 1 FROM public.security_events
      WHERE event_type = 'query_regression'
        AND metadata->>'queryid' = v_row.queryid::text
        AND created_at > now() - interval '1 hour'
    ) THEN
      PERFORM public.log_security_event(
        NULL,
        'query_regression',
        CASE WHEN v_row.regression_pct >= 500 THEN 'critical'
             WHEN v_row.regression_pct >= 200 THEN 'high'
             ELSE 'medium' END,
        format('Query %s degraded %s%% (baseline %sms → current %sms, %s calls)',
               v_row.queryid, v_row.regression_pct, v_row.base_mean, v_row.cur_mean, v_row.cur_calls),
        NULL, NULL,
        jsonb_build_object(
          'queryid', v_row.queryid,
          'query_text', v_row.query_text,
          'current_mean_ms', v_row.cur_mean,
          'baseline_mean_ms', v_row.base_mean,
          'regression_pct', v_row.regression_pct,
          'calls', v_row.cur_calls
        )
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END; $$;

REVOKE ALL ON FUNCTION public.alert_query_regressions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alert_query_regressions() TO service_role;

-- Bloat monitor: registra security_event quando alguma tabela crítica passa de 30% bloat
CREATE OR REPLACE FUNCTION public.monitor_table_bloat()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT
      s.relname AS table_name,
      s.n_dead_tup,
      s.n_live_tup,
      ROUND((s.n_dead_tup::numeric / NULLIF(s.n_live_tup + s.n_dead_tup, 0) * 100)::numeric, 2) AS bloat_pct
    FROM pg_stat_user_tables s
    WHERE s.schemaname = 'public'
      AND s.n_live_tup + s.n_dead_tup > 10000
      AND (s.n_dead_tup::numeric / NULLIF(s.n_live_tup + s.n_dead_tup, 0)) > 0.30
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.security_events
      WHERE event_type = 'table_bloat_high'
        AND metadata->>'table_name' = v_row.table_name
        AND created_at > now() - interval '24 hours'
    ) THEN
      PERFORM public.log_security_event(
        NULL,
        'table_bloat_high',
        CASE WHEN v_row.bloat_pct >= 60 THEN 'high' ELSE 'medium' END,
        format('Table %s has %s%% bloat (%s dead / %s live tuples)',
               v_row.table_name, v_row.bloat_pct, v_row.n_dead_tup, v_row.n_live_tup),
        NULL, NULL,
        jsonb_build_object(
          'table_name', v_row.table_name,
          'bloat_pct', v_row.bloat_pct,
          'dead_tuples', v_row.n_dead_tup,
          'live_tuples', v_row.n_live_tup
        )
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END; $$;

REVOKE ALL ON FUNCTION public.monitor_table_bloat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monitor_table_bloat() TO service_role;
