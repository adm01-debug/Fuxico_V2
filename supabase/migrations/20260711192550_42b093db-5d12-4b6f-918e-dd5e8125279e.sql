
CREATE INDEX IF NOT EXISTS idx_document_events_document_id ON public.document_events(document_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_email_audit_log_id ON public.fraud_alerts(email_audit_log_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_resolved_by ON public.fraud_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_geo_whitelist_added_by ON public.geo_whitelist(added_by);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_sequence_step_executions_step_id ON public.sequence_step_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON public.webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
ANALYZE public.document_events;
ANALYZE public.fraud_alerts;
ANALYZE public.geo_whitelist;
ANALYZE public.role_permissions;
ANALYZE public.sequence_step_executions;
ANALYZE public.webauthn_challenges;
ANALYZE public.webhook_logs;
