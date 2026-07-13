DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
      AND (c.relname='tracking_events' OR c.relname LIKE 'tracking_events\_%' ESCAPE '\')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_insert" ON public.%I', r.relname);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public insert on tracking_events" ON public.%I', r.relname);
    EXECUTE format('CREATE POLICY "block_client_insert" ON public.%I FOR INSERT WITH CHECK (false)', r.relname);
  END LOOP;
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
      AND (c.relname='rate_limit_logs' OR c.relname LIKE 'rate_limit_logs\_%' ESCAPE '\')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "system_insert" ON public.%I', r.relname);
    EXECUTE format('DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.%I', r.relname);
    EXECUTE format('CREATE POLICY "block_client_insert" ON public.%I FOR INSERT WITH CHECK (false)', r.relname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_rate_limit_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partition_name text; start_date date; end_date date;
BEGIN
  start_date := date_trunc('month', target_month)::date;
  end_date := (start_date + interval '1 month')::date;
  partition_name := 'rate_limit_logs_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.rate_limit_logs FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
  EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', partition_name);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "admin_select" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "admin_select" ON public.%I FOR SELECT USING (public.has_role(auth.uid(), ''admin''::app_role))', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "block_client_insert" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "block_client_insert" ON public.%I FOR INSERT WITH CHECK (false)', partition_name);
END $$;

CREATE OR REPLACE FUNCTION public.ensure_tracking_events_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partition_name text; start_date date; end_date date;
BEGIN
  start_date := date_trunc('month', target_month)::date;
  end_date := (start_date + interval '1 month')::date;
  partition_name := 'tracking_events_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.tracking_events FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
  EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', partition_name);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "block_client_insert" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "block_client_insert" ON public.%I FOR INSERT WITH CHECK (false)', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "own_via_tracked_emails_select" ON public.%I', partition_name);
  EXECUTE format($p$CREATE POLICY "own_via_tracked_emails_select" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.tracked_emails te WHERE te.tracking_id = %I.tracking_id AND te.user_id = auth.uid()))$p$, partition_name, partition_name);
END $$;