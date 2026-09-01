
ALTER TABLE public.tracking_events SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_limit = 2000,
  fillfactor = 90
);
ALTER TABLE public.tracked_emails SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  fillfactor = 90
);
ALTER TABLE public.link_click_events SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  fillfactor = 90
);
ALTER TABLE public.webhook_logs SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE public.rate_limit_logs SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE public.audit_logs SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE public.security_events SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE public.login_attempts SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

ALTER TABLE public.tracking_events ALTER COLUMN tracking_id SET STATISTICS 1000;
ALTER TABLE public.tracked_emails ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE public.tracked_emails ALTER COLUMN recipient_email SET STATISTICS 500;
ALTER TABLE public.link_click_events ALTER COLUMN link_id SET STATISTICS 1000;

ANALYZE public.tracking_events;
ANALYZE public.tracked_emails;
ANALYZE public.link_click_events;
