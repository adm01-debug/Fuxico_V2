
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE OR REPLACE FUNCTION public.run_tracking_events_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  r record;
  cutoff timestamptz := now() - interval '180 days';
  upper_bound text;
  upper_ts timestamptz;
BEGIN
  -- Drop whole monthly partitions whose upper bound is already older than the cutoff
  FOR r IN
    SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    WHERE i.inhparent = 'public.tracking_events'::regclass
      AND c.relname <> 'tracking_events_default'
  LOOP
    -- Extract upper bound: "FOR VALUES FROM ('YYYY-MM-DD') TO ('YYYY-MM-DD')"
    upper_bound := substring(r.bound FROM 'TO \(''([^'']+)''\)');
    IF upper_bound IS NULL THEN CONTINUE; END IF;
    upper_ts := upper_bound::timestamptz;
    IF upper_ts <= cutoff THEN
      EXECUTE format('DROP TABLE public.%I', r.relname);
      RAISE NOTICE 'Dropped partition %', r.relname;
    END IF;
  END LOOP;

  -- Cleanup any stray rows that ended up in the default partition
  DELETE FROM public.tracking_events_default WHERE created_at < cutoff;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.run_tracking_events_retention() FROM PUBLIC, anon, authenticated;
