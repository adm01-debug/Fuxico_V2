DO $$
DECLARE r RECORD; parent_name text;
BEGIN
  FOR r IN
    SELECT c.oid, c.relname AS part_name,
           (SELECT cp.relname FROM pg_class cp WHERE cp.oid = i.inhparent) AS parent
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)
  LOOP
    parent_name := r.parent;
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