
BEGIN;

DROP TABLE public.tracking_events CASCADE;

CREATE TABLE public.tracking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL,
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  referer text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  is_self_open boolean DEFAULT false,
  PRIMARY KEY (id, created_at),
  CONSTRAINT tracking_events_event_type_check CHECK (event_type IN ('open','click')),
  CONSTRAINT tracking_events_tracking_id_fkey FOREIGN KEY (tracking_id)
    REFERENCES public.tracked_emails(tracking_id) ON DELETE CASCADE
) PARTITION BY RANGE (created_at);

GRANT SELECT, INSERT ON public.tracking_events TO authenticated;
GRANT SELECT, INSERT ON public.tracking_events TO anon;
GRANT ALL ON public.tracking_events TO service_role;

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracking events"
ON public.tracking_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tracked_emails
  WHERE tracked_emails.tracking_id = tracking_events.tracking_id
    AND tracked_emails.user_id = auth.uid()
));

CREATE POLICY "Allow public insert on tracking_events"
ON public.tracking_events FOR INSERT
WITH CHECK (
  tracking_id IS NOT NULL
  AND tracking_id <> ''
  AND EXISTS (SELECT 1 FROM public.tracked_emails WHERE tracked_emails.tracking_id = tracking_events.tracking_id)
);

CREATE INDEX idx_tracking_events_created_at ON public.tracking_events (created_at);
CREATE INDEX idx_tracking_events_event_type ON public.tracking_events (event_type);
CREATE INDEX idx_tracking_events_self_open ON public.tracking_events (is_self_open);
CREATE INDEX idx_tracking_events_tracking_id ON public.tracking_events (tracking_id);
CREATE INDEX idx_tracking_events_id_type ON public.tracking_events (tracking_id, event_type);
CREATE INDEX idx_tracking_events_tracking_type_created ON public.tracking_events (tracking_id, event_type, created_at DESC);
CREATE INDEX idx_tracking_events_tracking_ip ON public.tracking_events (tracking_id, ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_tracking_events_created_brin ON public.tracking_events USING BRIN (created_at) WITH (pages_per_range = 64);

ALTER TABLE public.tracking_events ALTER COLUMN tracking_id SET STATISTICS 1000;

-- Partitions
CREATE TABLE public.tracking_events_2026_06 PARTITION OF public.tracking_events FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.tracking_events_2026_07 PARTITION OF public.tracking_events FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.tracking_events_2026_08 PARTITION OF public.tracking_events FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE public.tracking_events_2026_09 PARTITION OF public.tracking_events FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE public.tracking_events_2026_10 PARTITION OF public.tracking_events FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE public.tracking_events_2026_11 PARTITION OF public.tracking_events FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.tracking_events_2026_12 PARTITION OF public.tracking_events FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE public.tracking_events_2027_01 PARTITION OF public.tracking_events FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE public.tracking_events_default PARTITION OF public.tracking_events DEFAULT;

-- Apply storage params to leaf partitions
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname FROM pg_inherits i
           JOIN pg_class c ON c.oid = i.inhrelid
           WHERE i.inhparent = 'public.tracking_events'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02, autovacuum_vacuum_cost_limit = 2000, fillfactor = 90)', r.relname);
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
  END IF;
END; $fn$;

REVOKE EXECUTE ON FUNCTION public.ensure_tracking_events_partition(date) FROM PUBLIC, anon, authenticated;

COMMIT;

SELECT cron.schedule(
  'ensure_tracking_events_partition_monthly',
  '0 2 25 * *',
  $$ SELECT public.ensure_tracking_events_partition((date_trunc('month', now()) + interval '1 month')::date); $$
);
