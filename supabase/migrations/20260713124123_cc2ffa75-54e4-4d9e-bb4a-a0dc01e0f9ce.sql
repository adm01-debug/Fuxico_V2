-- Onda 67: Espelhar policies dos pais particionados em cada partição folha
DO $$
DECLARE
  r RECORD;
  parent_name text;
BEGIN
  FOR r IN
    SELECT c.oid, c.relname AS part_name, i.inhparent::regclass::text AS parent
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND i.inhparent::regclass::text IN (
        'public.audit_logs','public.login_attempts','public.rate_limit_logs',
        'public.security_events','public.tracking_events','public.webhook_logs'
      )
      AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)
  LOOP
    parent_name := split_part(r.parent, '.', 2);
    IF parent_name = 'audit_logs' THEN
      EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', r.part_name);
    ELSIF parent_name = 'login_attempts' THEN
      EXECUTE format('CREATE POLICY "admin_select" ON public.%I FOR SELECT USING (public.has_role(auth.uid(), ''admin''::app_role))', r.part_name);
    ELSIF parent_name = 'rate_limit_logs' THEN
      EXECUTE format('CREATE POLICY "admin_select" ON public.%I FOR SELECT USING (public.has_role(auth.uid(), ''admin''::app_role))', r.part_name);
      EXECUTE format('CREATE POLICY "system_insert" ON public.%I FOR INSERT WITH CHECK (true)', r.part_name);
    ELSIF parent_name = 'security_events' THEN
      EXECUTE format('CREATE POLICY "own_or_admin_select" ON public.%I FOR SELECT USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), ''admin''::app_role))', r.part_name);
      EXECUTE format('CREATE POLICY "auth_insert_own" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', r.part_name);
    ELSIF parent_name = 'tracking_events' THEN
      EXECUTE format('CREATE POLICY "public_insert" ON public.%I FOR INSERT WITH CHECK (true)', r.part_name);
      EXECUTE format($p$CREATE POLICY "own_via_tracked_emails_select" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.tracked_emails te WHERE te.tracking_id = %I.tracking_id AND te.user_id = auth.uid()))$p$, r.part_name, r.part_name);
    ELSIF parent_name = 'webhook_logs' THEN
      EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', r.part_name);
      EXECUTE format('CREATE POLICY "own_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', r.part_name);
    END IF;
  END LOOP;
END $$;

-- Recriar funções ensure_*_partition preservando o nome do parâmetro original (target_month)
CREATE OR REPLACE FUNCTION public.ensure_audit_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partition_name text; start_date date; end_date date;
BEGIN
  start_date := date_trunc('month', target_month)::date;
  end_date := (start_date + interval '1 month')::date;
  partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.audit_logs FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
  EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', partition_name);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "own_select" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', partition_name);
END $$;

CREATE OR REPLACE FUNCTION public.ensure_login_attempts_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partition_name text; start_date date; end_date date;
BEGIN
  start_date := date_trunc('month', target_month)::date;
  end_date := (start_date + interval '1 month')::date;
  partition_name := 'login_attempts_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.login_attempts FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
  EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', partition_name);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "admin_select" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "admin_select" ON public.%I FOR SELECT USING (public.has_role(auth.uid(), ''admin''::app_role))', partition_name);
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
  EXECUTE format('DROP POLICY IF EXISTS "system_insert" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "system_insert" ON public.%I FOR INSERT WITH CHECK (true)', partition_name);
END $$;

CREATE OR REPLACE FUNCTION public.ensure_security_events_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partition_name text; start_date date; end_date date;
BEGIN
  start_date := date_trunc('month', target_month)::date;
  end_date := (start_date + interval '1 month')::date;
  partition_name := 'security_events_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.security_events FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
  EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', partition_name);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "own_or_admin_select" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "own_or_admin_select" ON public.%I FOR SELECT USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), ''admin''::app_role))', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "auth_insert_own" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "auth_insert_own" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', partition_name);
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
  EXECUTE format('DROP POLICY IF EXISTS "public_insert" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "public_insert" ON public.%I FOR INSERT WITH CHECK (true)', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "own_via_tracked_emails_select" ON public.%I', partition_name);
  EXECUTE format($p$CREATE POLICY "own_via_tracked_emails_select" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.tracked_emails te WHERE te.tracking_id = %I.tracking_id AND te.user_id = auth.uid()))$p$, partition_name, partition_name);
END $$;

CREATE OR REPLACE FUNCTION public.ensure_webhook_logs_partition(target_month date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partition_name text; start_date date; end_date date;
BEGIN
  start_date := date_trunc('month', target_month)::date;
  end_date := (start_date + interval '1 month')::date;
  partition_name := 'webhook_logs_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.webhook_logs FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
  EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02, autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500, fillfactor=90)', partition_name);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "own_select" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', partition_name);
  EXECUTE format('DROP POLICY IF EXISTS "own_insert" ON public.%I', partition_name);
  EXECUTE format('CREATE POLICY "own_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', partition_name);
END $$;