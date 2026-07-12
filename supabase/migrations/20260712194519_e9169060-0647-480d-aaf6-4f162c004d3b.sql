
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending_by_user
  ON public.scheduled_emails (user_id, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_active_by_user
  ON public.sequence_enrollments (user_id, sequence_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_campaigns_active_by_user
  ON public.campaigns (user_id, updated_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_pending
  ON public.follow_up_reminders (user_id, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bounce_alerts_unresolved
  ON public.bounce_alerts (user_id, created_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_configs_active
  ON public.webhook_configs (user_id)
  WHERE is_active = true;

CREATE OR REPLACE VIEW public.admin_table_health
WITH (security_invoker = true) AS
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE WHEN n_live_tup > 0
       THEN ROUND((n_dead_tup::numeric / NULLIF(n_live_tup, 0)) * 100, 2)
       ELSE 0 END AS dead_tuple_pct,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) AS total_size,
  pg_total_relation_size(schemaname || '.' || relname) AS total_size_bytes,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  vacuum_count,
  autovacuum_count,
  n_mod_since_analyze AS rows_modified_since_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND has_role(auth.uid(), 'admin')
ORDER BY pg_total_relation_size(schemaname || '.' || relname) DESC;

REVOKE ALL ON public.admin_table_health FROM anon, authenticated;
GRANT SELECT ON public.admin_table_health TO authenticated;

COMMENT ON VIEW public.admin_table_health IS
  'Admin-only. Saúde de tabelas: dead tuples, bloat, last_vacuum/analyze e tamanho total.';
