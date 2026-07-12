
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname FROM pg_inherits i
           JOIN pg_class c ON c.oid = i.inhrelid
           WHERE i.inhparent = 'public.tracking_events'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_tracking_events_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  start_date date := date_trunc('month', target_month)::date;
  end_date   date := (date_trunc('month', target_month) + interval '1 month')::date;
  part_name  text := format('tracking_events_%s', to_char(start_date, 'YYYY_MM'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name AND relkind = 'r') THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.tracking_events FOR VALUES FROM (%L) TO (%L)', part_name, start_date, end_date);
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02, autovacuum_vacuum_cost_limit = 2000, fillfactor = 90)', part_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
  END IF;
END; $fn$;
