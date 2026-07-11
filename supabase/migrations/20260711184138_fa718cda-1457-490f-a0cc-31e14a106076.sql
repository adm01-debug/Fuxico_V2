
-- Índices de alto impacto identificados por auditoria de gaps.
-- Todos criados com IF NOT EXISTS para idempotência.

-- audit_logs: consultas por usuário ordenadas por tempo + filtros por tipo/severidade
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_severity
  ON public.audit_logs (event_type, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

-- link_click_events: joins pesados por link_id + varredura temporal
CREATE INDEX IF NOT EXISTS idx_link_click_events_link_id_created
  ON public.link_click_events (link_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_link_click_events_created_at
  ON public.link_click_events (created_at DESC);

-- contact_scores: dashboard de leads ordenado por score
CREATE INDEX IF NOT EXISTS idx_contact_scores_user_score
  ON public.contact_scores (user_id, engagement_score DESC);

CREATE INDEX IF NOT EXISTS idx_contact_scores_user_level
  ON public.contact_scores (user_id, score_level);

-- webhook_logs: listagem paginada por usuário
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_created
  ON public.webhook_logs (user_id, created_at DESC);

-- tracked_emails: índice parcial para dashboards de bounce (alta seletividade)
CREATE INDEX IF NOT EXISTS idx_tracked_emails_bounced_partial
  ON public.tracked_emails (user_id, bounce_detected_at DESC)
  WHERE delivery_status = 'bounced';

-- sequence_step_executions: consultas de progresso por enrollment ordenadas por tempo
CREATE INDEX IF NOT EXISTS idx_seq_step_exec_enrollment_created
  ON public.sequence_step_executions (enrollment_id, created_at DESC);

-- Atualiza estatísticas para planner escolher os novos índices
ANALYZE public.audit_logs;
ANALYZE public.link_click_events;
ANALYZE public.contact_scores;
ANALYZE public.webhook_logs;
ANALYZE public.tracked_emails;
ANALYZE public.sequence_step_executions;
