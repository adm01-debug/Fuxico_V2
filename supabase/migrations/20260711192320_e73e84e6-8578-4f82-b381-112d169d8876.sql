
-- Domain integrity: CHECK constraints em colunas enum-like que ainda são TEXT livre.
-- Todas as tabelas estão vazias (validado), então NOT VALID não é necessário.

ALTER TABLE public.tracked_emails
  ADD CONSTRAINT tracked_emails_delivery_status_check
  CHECK (delivery_status IN ('pending','sent','delivered','bounced','failed','deferred','complained'));

ALTER TABLE public.tracked_emails
  ADD CONSTRAINT tracked_emails_bounce_type_check
  CHECK (bounce_type IS NULL OR bounce_type IN ('hard','soft','block','complaint'));

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_severity_check
  CHECK (severity IN ('info','warning','error','critical'));

ALTER TABLE public.security_events
  ADD CONSTRAINT security_events_severity_check
  CHECK (severity IN ('info','warning','error','critical'));

ALTER TABLE public.contact_scores
  ADD CONSTRAINT contact_scores_score_level_check
  CHECK (score_level IN ('cold','cool','warm','hot'));

ALTER TABLE public.contact_scores
  ADD CONSTRAINT contact_scores_engagement_score_range
  CHECK (engagement_score >= 0 AND engagement_score <= 100);

ALTER TABLE public.bounce_alerts
  ADD CONSTRAINT bounce_alerts_alert_type_check
  CHECK (alert_type IN ('warning','critical','info'));

ALTER TABLE public.bounce_alerts
  ADD CONSTRAINT bounce_alerts_bounce_rate_range
  CHECK (bounce_rate >= 0 AND bounce_rate <= 100);

ALTER TABLE public.scheduled_emails
  ADD CONSTRAINT scheduled_emails_status_check
  CHECK (status IN ('pending','scheduled','sending','sent','failed','cancelled'));

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('draft','scheduled','active','paused','completed','archived'));

ALTER TABLE public.notification_history
  ADD CONSTRAINT notification_history_severity_check
  CHECK (severity IN ('info','success','warning','error'));

-- Garantir emails em lower-case para evitar duplicações lógicas.
ALTER TABLE public.unsubscribed_emails
  ADD CONSTRAINT unsubscribed_emails_lower_email
  CHECK (email = lower(email));

ALTER TABLE public.contact_scores
  ADD CONSTRAINT contact_scores_lower_email
  CHECK (email = lower(email));
