CREATE INDEX IF NOT EXISTS idx_security_events_metadata_gin
  ON public.security_events USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_security_events_metadata_text_trgm
  ON public.security_events USING gin ((metadata::text) extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_security_events_description_trgm
  ON public.security_events USING gin (description extensions.gin_trgm_ops);

-- Parser compartilhado: retorna termos incluídos, excluídos e pares campo:valor
CREATE OR REPLACE FUNCTION public.parse_alert_search(_search text)
RETURNS TABLE(kind text, field text, value text)
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  _tok text;
  _neg boolean;
  _f text;
  _v text;
BEGIN
  IF _search IS NULL OR btrim(_search) = '' THEN
    RETURN;
  END IF;

  FOR _tok IN
    SELECT m[1] FROM regexp_matches(_search, '"[^"]*"|\S+', 'g') AS m
  LOOP
    _neg := false;
    IF left(_tok, 1) = '-' AND length(_tok) > 1 THEN
      _neg := true;
      _tok := substr(_tok, 2);
    END IF;

    _f := NULL;
    IF _tok ~ '^[a-zA-Z_]+:' THEN
      _f := lower(split_part(_tok, ':', 1));
      _v := substr(_tok, length(_f) + 2);
      IF _f NOT IN ('id','event_type','severity','description','dispatch_status','error_message','metadata','channels') THEN
        _f := NULL;
        _v := _tok;
      END IF;
    ELSE
      _v := _tok;
    END IF;

    _v := btrim(_v, '"');
    IF _v = '' THEN
      CONTINUE;
    END IF;

    IF _neg THEN
      RETURN QUERY SELECT 'exclude'::text, NULL::text, lower(_v);
    ELSIF _f IS NOT NULL THEN
      RETURN QUERY SELECT 'field'::text, _f, lower(_v);
    ELSE
      RETURN QUERY SELECT 'include'::text, NULL::text, lower(_v);
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.parse_alert_search(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_critical_alerts(
  _hours integer DEFAULT 72,
  _event_types text[] DEFAULT NULL::text[],
  _severities text[] DEFAULT ARRAY['critical','high','error','warning'],
  _dispatch_status text DEFAULT NULL::text,
  _limit integer DEFAULT 200,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, event_type text, severity text, description text, metadata jsonb, created_at timestamp with time zone, dispatch_status text, dispatched_at timestamp with time zone, admin_count integer, channels text[], error_message text, total_count bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      SELECT status, dispatched_at, admin_count, channels, error_message
      FROM public.alert_dispatch_log
      WHERE security_event_id = b.id
      ORDER BY dispatched_at DESC
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
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_critical_alerts_summary(
  _hours integer DEFAULT 24,
  _search text DEFAULT NULL::text
)
RETURNS TABLE(event_type text, severity text, total bigint, sent bigint, failed bigint, pending bigint, last_seen timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _since timestamptz := now() - make_interval(hours => GREATEST(_hours, 1));
  _inc text[];
  _exc text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(array_agg(p.value) FILTER (WHERE p.kind IN ('include','field')), '{}'),
         coalesce(array_agg(p.value) FILTER (WHERE p.kind = 'exclude'), '{}')
    INTO _inc, _exc
  FROM public.parse_alert_search(_search) p;

  RETURN QUERY
  WITH src AS (
    SELECT se.id, se.event_type, se.severity, se.created_at,
           lower(concat_ws(' ', se.id::text, se.event_type, se.severity, se.description, se.metadata::text)) AS haystack
    FROM public.security_events se
    WHERE se.created_at >= _since
      AND se.severity IN ('critical','high','error','warning')
  ),
  f AS (
    SELECT * FROM src s
    WHERE (cardinality(_inc) = 0 OR s.haystack LIKE ALL (SELECT '%' || t || '%' FROM unnest(_inc) t))
      AND (cardinality(_exc) = 0 OR NOT (s.haystack LIKE ANY (SELECT '%' || t || '%' FROM unnest(_exc) t)))
  )
  SELECT f.event_type,
         f.severity,
         count(*)::bigint AS total,
         count(*) FILTER (WHERE adl.status = 'sent')::bigint AS sent,
         count(*) FILTER (WHERE adl.status = 'failed')::bigint AS failed,
         count(*) FILTER (WHERE adl.status IS NULL)::bigint AS pending,
         max(f.created_at) AS last_seen
  FROM f
  LEFT JOIN LATERAL (
    SELECT status FROM public.alert_dispatch_log
    WHERE security_event_id = f.id
    ORDER BY dispatched_at DESC
    LIMIT 1
  ) adl ON TRUE
  GROUP BY f.event_type, f.severity
  ORDER BY total DESC, last_seen DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_critical_alerts(integer, text[], text[], text, integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_critical_alerts_summary(integer, text) FROM PUBLIC, anon, authenticated;