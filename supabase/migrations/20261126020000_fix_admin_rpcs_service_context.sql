-- =============================================================================
-- Painel admin: destrava has_role sob service_role e corrige as RPCs admin
--
-- Evidencia (probe real em producao, 2026-11-26), ANTES do fix:
--
--   POST /rest/v1/rpc/admin_ops_dashboard   (service_role)  -> 42501 forbidden
--   POST /rest/v1/rpc/admin_table_bloat     (service_role)  -> 42501 forbidden
--   POST /rest/v1/rpc/admin_list_health_score_snapshots     -> 22012 division by zero
--   POST /rest/v1/rpc/admin_webhook_failure_rates           -> 22012 division by zero
--   POST /rest/v1/rpc/admin_query_regressions               -> 42804 numeric vs bigint
--   POST /rest/v1/rpc/admin_list_cron_failures              -> 42703 coluna url inexistente
--   POST /rest/v1/rpc/admin_stale_indexes                   -> 42702 ambiguous column
--   POST /rest/v1/rpc/admin_list_critical_alerts            -> 42702 ambiguous column
--   POST /rest/v1/rpc/admin_preview_index_drop              -> 42703 i.indexrelid inexistente
--   SELECT public.capture_query_performance_snapshot()      -> 42P01 pg_stat_statements inexistente
--   SELECT public.reset_slow_query_stats()                  -> 42883 pg_stat_statements_reset inexistente
--
-- Causa raiz unica do 42501: os guards chamam has_role(auth.uid(),'admin') e a edge
-- admin-rpc executa com a service key; nesse contexto auth.uid() e NULL e o EXISTS
-- interno vira user_id = NULL (sempre falso). O atalho de service context no
-- has_role destrava as ~20 RPCs do painel sem tocar em cada funcao.
--
-- Causa raiz do 42P01/42883: o hardening de search_path (search_path=public) deixou
-- pg_stat_statements (schema extensions) invisivel para 3 funcoes de performance.
--
-- Todas as assinaturas abaixo preservam o contrato de saida consumido pelo front
-- (src/types/observability.ts, src/components/admin/*.tsx).
-- =============================================================================


-- has_role(uuid,app_role)
-- Guard central: sob service_role (auth.uid() e NULL) todas as RPCs admin respondiam 42501 forbidden. A edge admin-rpc executa com a service key, entao TODA a UI admin estava morta. Atalho adicionado: service_role ja bypassa RLS, logo nao amplia superficie.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_service_context() THEN
    RETURN true;
  END IF;
  IF auth.uid() IS NULL AND NOT public.is_service_context() THEN
    RETURN false;
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role
  );
END;
$function$


-- capture_query_performance_snapshot()
-- search_path=public escondia a extensao: 42P01 relation pg_stat_statements does not exist (cron fuxico-capture-query-perf falhava a cada hora, alimentando alertas e deixando query_performance_snapshots vazia).
CREATE OR REPLACE FUNCTION public.capture_query_performance_snapshot()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_inserted integer;
BEGIN
  INSERT INTO public.query_performance_snapshots
    (queryid, query_text, calls, total_exec_ms, mean_exec_ms, max_exec_ms, stddev_exec_ms, rows, cache_hit_ratio_pct)
  SELECT
    s.queryid,
    LEFT(s.query, 2000),
    s.calls,
    ROUND(s.total_exec_time::numeric, 2),
    ROUND(s.mean_exec_time::numeric, 2),
    ROUND(s.max_exec_time::numeric, 2),
    ROUND(s.stddev_exec_time::numeric, 2),
    s.rows,
    CASE WHEN s.shared_blks_hit + s.shared_blks_read > 0
         THEN ROUND((s.shared_blks_hit::numeric / (s.shared_blks_hit + s.shared_blks_read)) * 100, 2)
         ELSE NULL END
  FROM extensions.pg_stat_statements s
  JOIN pg_database d ON d.oid = s.dbid
  WHERE d.datname = current_database()
    AND s.calls >= 5
    AND s.query NOT ILIKE '%pg_stat_statements%'
    AND s.query NOT ILIKE '%query_performance_snapshots%'
  ORDER BY s.mean_exec_time DESC
  LIMIT 50;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Retenção 30 dias
  DELETE FROM public.query_performance_snapshots WHERE snapshot_at < now() - interval '30 days';
  RETURN v_inserted;
END; $function$


-- reset_slow_query_stats()
-- Mesma causa: 42883 function pg_stat_statements_reset() does not exist.
CREATE OR REPLACE FUNCTION public.reset_slow_query_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  PERFORM extensions.pg_stat_statements_reset();
END;
$function$


-- analyze_index_pre_drop(text,integer)
-- Mesma causa: 42P01 ao ler pg_stat_statements.
CREATE OR REPLACE FUNCTION public.analyze_index_pre_drop(_index_name text, _top_n integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      FROM extensions.pg_stat_statements
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
$function$


-- admin_preview_index_drop(text)
-- 42703 column i.indexrelid does not exist: indexrelid pertence a pg_index, nao a pg_class.
CREATE OR REPLACE FUNCTION public.admin_preview_index_drop(_index_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT n.nspname, c.relname, pg_get_indexdef(ix.indexrelid),
         pg_relation_size(ix.indexrelid), ix.indisunique, ix.indisprimary
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
$function$


-- admin_query_regressions(numeric)
-- 42804: SUM(bigint) retorna numeric e a coluna de saida declara bigint.
CREATE OR REPLACE FUNCTION public.admin_query_regressions(_threshold_pct numeric DEFAULT 50)
 RETURNS TABLE(queryid bigint, query_text text, current_mean_ms numeric, baseline_mean_ms numeric, regression_pct numeric, current_calls bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH current_window AS (
    SELECT qps.queryid, AVG(qps.mean_exec_ms) AS cur_mean, MAX(qps.query_text) AS q, SUM(qps.calls)::bigint AS cur_calls
    FROM public.query_performance_snapshots qps
    WHERE qps.snapshot_at >= now() - interval '1 hour'
    GROUP BY qps.queryid
  ),
  baseline AS (
    SELECT qps.queryid, AVG(qps.mean_exec_ms) AS base_mean
    FROM public.query_performance_snapshots qps
    WHERE qps.snapshot_at BETWEEN now() - interval '25 hours' AND now() - interval '1 hour'
    GROUP BY qps.queryid
  )
  SELECT
    c.queryid,
    LEFT(c.q, 500),
    ROUND(c.cur_mean, 2),
    ROUND(b.base_mean, 2),
    ROUND(((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) * 100, 2),
    c.cur_calls
  FROM current_window c
  JOIN baseline b ON b.queryid = c.queryid
  WHERE b.base_mean > 1
    AND ((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) * 100 >= _threshold_pct
  ORDER BY ((c.cur_mean - b.base_mean) / NULLIF(b.base_mean, 0)) DESC
  LIMIT 50;
END; $function$


-- admin_list_cron_failures(integer)
-- 42703: a funcao lia url/status_code/replayed_at, que nao existem; as colunas reais sao request_url/http_status/resolved_at.
CREATE OR REPLACE FUNCTION public.admin_list_cron_failures(_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, job_name text, url text, status_code integer, error_message text, attempts integer, replayed_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '2s'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT cjf.id, cjf.job_name, cjf.request_url, cjf.http_status, cjf.error_message,
         COALESCE(cjf.attempts, 1), cjf.resolved_at, cjf.created_at
  FROM public.cron_job_failures cjf
  ORDER BY cjf.created_at DESC
  LIMIT LEAST(_limit, 500);
END; $function$


-- admin_stale_indexes(integer)
-- 42702: OUT params colidiam com colunas das CTEs; qualificado com alias ius.
CREATE OR REPLACE FUNCTION public.admin_stale_indexes(_days integer DEFAULT 30)
 RETURNS TABLE(schema_name text, table_name text, index_name text, current_scans bigint, scans_delta bigint, index_size text, first_seen timestamp with time zone, last_seen timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '2s'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (ius.schema_name, ius.table_name, ius.index_name)
      ius.schema_name, ius.table_name, ius.index_name, ius.idx_scan, ius.index_size_bytes, ius.snapshot_at
    FROM public.index_usage_snapshots ius
    ORDER BY ius.schema_name, ius.table_name, ius.index_name, ius.snapshot_at DESC
  ),
  oldest AS (
    SELECT DISTINCT ON (ius.schema_name, ius.table_name, ius.index_name)
      ius.schema_name, ius.table_name, ius.index_name, ius.idx_scan, ius.snapshot_at
    FROM public.index_usage_snapshots ius
    WHERE ius.snapshot_at >= now() - make_interval(days => _days)
    ORDER BY ius.schema_name, ius.table_name, ius.index_name, ius.snapshot_at ASC
  )
  SELECT
    l.schema_name,
    l.table_name,
    l.index_name,
    l.idx_scan,
    (l.idx_scan - COALESCE(o.idx_scan, 0)) AS scans_delta,
    pg_size_pretty(l.index_size_bytes),
    o.snapshot_at,
    l.snapshot_at
  FROM latest l
  LEFT JOIN oldest o ON o.schema_name = l.schema_name AND o.table_name = l.table_name AND o.index_name = l.index_name
  WHERE (l.idx_scan - COALESCE(o.idx_scan, 0)) = 0
    AND l.index_size_bytes > 1024 * 1024
    AND l.index_name NOT LIKE '%_pkey'
    AND l.index_name NOT LIKE '%_key'
  ORDER BY l.index_size_bytes DESC
  LIMIT 100;
END; $function$


-- admin_list_health_score_snapshots(integer)
-- 22012 division by zero: o truque ELSE (SELECT 1/0) vira InitPlan e e avaliado mesmo quando o CASE escolhe true.
CREATE OR REPLACE FUNCTION public.admin_list_health_score_snapshots(_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, score numeric, grade text, breakdown jsonb, captured_by uuid, source text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.id, s.score, s.grade, s.breakdown, s.captured_by, s.source, s.created_at
  FROM public.health_score_snapshots s
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY s.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 500);
$function$


-- admin_webhook_failure_rates()
-- 22012 division by zero: mesmo truque anti-admin no CTE auth_check.
CREATE OR REPLACE FUNCTION public.admin_webhook_failure_rates()
 RETURNS TABLE(webhook_id uuid, webhook_url text, is_active boolean, total_24h bigint, success_24h bigint, failure_24h bigint, failure_rate_24h numeric, total_7d bigint, success_7d bigint, failure_7d bigint, failure_rate_7d numeric, last_failure_at timestamp with time zone, last_success_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH agg AS (
    SELECT
      wl.webhook_id,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '24 hours') AS total_24h,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '24 hours' AND wl.success) AS success_24h,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '24 hours' AND NOT wl.success) AS failure_24h,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '7 days') AS total_7d,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '7 days' AND wl.success) AS success_7d,
      count(*) FILTER (WHERE wl.created_at >= now() - interval '7 days' AND NOT wl.success) AS failure_7d,
      max(wl.created_at) FILTER (WHERE NOT wl.success) AS last_failure_at,
      max(wl.created_at) FILTER (WHERE wl.success) AS last_success_at
    FROM public.webhook_logs wl
    WHERE wl.created_at >= now() - interval '7 days'
      AND wl.webhook_id IS NOT NULL
      AND public.has_role(auth.uid(), 'admin'::app_role)
    GROUP BY wl.webhook_id
  )
  SELECT
    a.webhook_id,
    wc.url AS webhook_url,
    wc.is_active,
    a.total_24h,
    a.success_24h,
    a.failure_24h,
    CASE WHEN a.total_24h > 0 THEN round((a.failure_24h::numeric / a.total_24h) * 100, 2) ELSE 0 END AS failure_rate_24h,
    a.total_7d,
    a.success_7d,
    a.failure_7d,
    CASE WHEN a.total_7d > 0 THEN round((a.failure_7d::numeric / a.total_7d) * 100, 2) ELSE 0 END AS failure_rate_7d,
    a.last_failure_at,
    a.last_success_at
  FROM agg a
  LEFT JOIN public.webhook_configs wc ON wc.id = a.webhook_id
  ORDER BY a.failure_24h DESC, a.failure_7d DESC;
$function$


-- admin_list_critical_alerts(integer,text[],text[],text,integer,integer,text)
-- 42702: o LATERAL lia colunas nao qualificadas de alert_dispatch_log que colidiam com os OUT params (dispatched_at, channels, error_message).
CREATE OR REPLACE FUNCTION public.admin_list_critical_alerts(_hours integer DEFAULT 72, _event_types text[] DEFAULT NULL::text[], _severities text[] DEFAULT ARRAY['critical'::text, 'high'::text, 'error'::text, 'warning'::text], _dispatch_status text DEFAULT NULL::text, _limit integer DEFAULT 200, _offset integer DEFAULT 0, _search text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, event_type text, severity text, description text, metadata jsonb, created_at timestamp with time zone, dispatch_status text, dispatched_at timestamp with time zone, admin_count integer, channels text[], error_message text, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _since timestamptz := now() - make_interval(hours => GREATEST(_hours, 1));
  _inc text[];
  _exc text[];
  _ff text[];
  _fv text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(array_agg(p.value) FILTER (WHERE p.kind = 'include'), '{}'),
         coalesce(array_agg(p.value) FILTER (WHERE p.kind = 'exclude'), '{}'),
         coalesce(array_agg(p.field) FILTER (WHERE p.kind = 'field'), '{}'),
         coalesce(array_agg(p.value) FILTER (WHERE p.kind = 'field'), '{}')
    INTO _inc, _exc, _ff, _fv
  FROM public.parse_alert_search(_search) p;

  RETURN QUERY
  WITH base AS (
    SELECT se.id, se.event_type, se.severity, se.description, se.metadata, se.created_at
    FROM public.security_events se
    WHERE se.created_at >= _since
      AND se.severity = ANY(_severities)
      AND (_event_types IS NULL OR se.event_type = ANY(_event_types))
  ),
  joined AS (
    SELECT b.*,
           COALESCE(adl.status, 'pending') AS dispatch_status,
           adl.dispatched_at,
           COALESCE(adl.admin_count, 0) AS admin_count,
           COALESCE(adl.channels, ARRAY[]::text[]) AS channels,
           adl.error_message
    FROM base b
    LEFT JOIN LATERAL (
      SELECT al.status, al.dispatched_at, al.admin_count, al.channels, al.error_message
      FROM public.alert_dispatch_log al
      WHERE al.security_event_id = b.id
      ORDER BY al.dispatched_at DESC
      LIMIT 1
    ) adl ON TRUE
  ),
  hay AS (
    SELECT j.*,
           lower(concat_ws(' ',
             j.id::text, j.event_type, j.severity, j.description,
             j.dispatch_status, j.error_message, j.metadata::text,
             array_to_string(j.channels, ' ')
           )) AS haystack
    FROM joined j
  ),
  filtered AS (
    SELECT * FROM hay h
    WHERE (_dispatch_status IS NULL OR h.dispatch_status = _dispatch_status)
      AND (cardinality(_inc) = 0 OR h.haystack LIKE ALL (SELECT '%' || t || '%' FROM unnest(_inc) t))
      AND (cardinality(_exc) = 0 OR NOT (h.haystack LIKE ANY (SELECT '%' || t || '%' FROM unnest(_exc) t)))
      AND (cardinality(_ff) = 0 OR NOT EXISTS (
            SELECT 1 FROM unnest(_ff, _fv) AS q(f, v)
            WHERE position(q.v IN lower(coalesce(
                    CASE q.f
                      WHEN 'id' THEN h.id::text
                      WHEN 'event_type' THEN h.event_type
                      WHEN 'severity' THEN h.severity
                      WHEN 'description' THEN h.description
                      WHEN 'dispatch_status' THEN h.dispatch_status
                      WHEN 'error_message' THEN h.error_message
                      WHEN 'metadata' THEN h.metadata::text
                      WHEN 'channels' THEN array_to_string(h.channels, ' ')
                    END, ''))) = 0
          ))
  ),
  counted AS (SELECT count(*)::bigint AS n FROM filtered)
  SELECT f.id, f.event_type, f.severity, f.description, f.metadata, f.created_at,
         f.dispatch_status, f.dispatched_at, f.admin_count, f.channels, f.error_message,
         (SELECT n FROM counted) AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT GREATEST(_limit, 1)
  OFFSET GREATEST(_offset, 0);
END; $function$


-- admin_list_critical_alerts(integer,text[],text[],text,integer,integer)
-- Mesmo defeito do overload de 7 argumentos.
CREATE OR REPLACE FUNCTION public.admin_list_critical_alerts(_hours integer DEFAULT 72, _event_types text[] DEFAULT NULL::text[], _severities text[] DEFAULT ARRAY['critical'::text, 'high'::text, 'error'::text, 'warning'::text], _dispatch_status text DEFAULT NULL::text, _limit integer DEFAULT 200, _offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, event_type text, severity text, description text, metadata jsonb, created_at timestamp with time zone, dispatch_status text, dispatched_at timestamp with time zone, admin_count integer, channels text[], error_message text, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _since timestamptz := now() - make_interval(hours => GREATEST(_hours, 1));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT se.id, se.event_type, se.severity, se.description, se.metadata, se.created_at
    FROM public.security_events se
    WHERE se.created_at >= _since
      AND se.severity = ANY(_severities)
      AND (_event_types IS NULL OR se.event_type = ANY(_event_types))
  ),
  joined AS (
    SELECT b.*,
           COALESCE(adl.status, 'pending') AS dispatch_status,
           adl.dispatched_at,
           COALESCE(adl.admin_count, 0) AS admin_count,
           COALESCE(adl.channels, ARRAY[]::text[]) AS channels,
           adl.error_message
    FROM base b
    LEFT JOIN LATERAL (
      SELECT al.status, al.dispatched_at, al.admin_count, al.channels, al.error_message
      FROM public.alert_dispatch_log al
      WHERE al.security_event_id = b.id
      ORDER BY al.dispatched_at DESC
      LIMIT 1
    ) adl ON TRUE
  ),
  filtered AS (
    SELECT j.* FROM joined j
    WHERE _dispatch_status IS NULL OR j.dispatch_status = _dispatch_status
  ),
  counted AS (SELECT count(*)::bigint AS n FROM filtered)
  SELECT f.id, f.event_type, f.severity, f.description, f.metadata, f.created_at,
         f.dispatch_status, f.dispatched_at, f.admin_count, f.channels, f.error_message,
         (SELECT n FROM counted) AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT GREATEST(_limit, 1)
  OFFSET GREATEST(_offset, 0);
END; $function$
