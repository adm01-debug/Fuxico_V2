-- Melhoria incremental: índices BRIN para tabelas append-only de série temporal.
-- BRIN é ~1000x menor que btree e ideal para colunas time-ordered em tabelas grandes.
-- Complementa (não substitui) os btree existentes; o planner escolhe o melhor conforme cardinalidade.

-- tracking_events: opens/clicks (alto volume, append-only por created_at)
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_brin
  ON public.tracking_events USING BRIN (created_at) WITH (pages_per_range = 64);

-- document_events: visualizações de anexos (append-only)
CREATE INDEX IF NOT EXISTS idx_document_events_created_brin
  ON public.document_events USING BRIN (created_at) WITH (pages_per_range = 64);

-- link_click_events: cliques detalhados (append-only)
CREATE INDEX IF NOT EXISTS idx_link_click_events_created_brin
  ON public.link_click_events USING BRIN (created_at) WITH (pages_per_range = 64);

-- audit_logs: trilha de auditoria (append-only, consultas por janela temporal)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_brin
  ON public.audit_logs USING BRIN (created_at) WITH (pages_per_range = 64);

-- login_attempts: telemetria anti-brute-force (janela deslizante)
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_brin
  ON public.login_attempts USING BRIN (created_at) WITH (pages_per_range = 64);

-- webhook_logs: telemetria outbound (append-only)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_brin
  ON public.webhook_logs USING BRIN (created_at) WITH (pages_per_range = 64);

-- rate_limit_logs: alto volume, retention curto
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_brin
  ON public.rate_limit_logs USING BRIN (created_at) WITH (pages_per_range = 64);

-- security_events: eventos de segurança (append-only)
CREATE INDEX IF NOT EXISTS idx_security_events_created_brin
  ON public.security_events USING BRIN (created_at) WITH (pages_per_range = 64);

-- Ajustar autovacuum das tabelas append-only mais quentes para manter BRIN em dia
ALTER TABLE public.tracking_events   SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE public.link_click_events SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE public.audit_logs        SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.rate_limit_logs   SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);

-- Refresh de estatísticas para o planner adotar os novos índices imediatamente
ANALYZE public.tracking_events;
ANALYZE public.document_events;
ANALYZE public.link_click_events;
ANALYZE public.audit_logs;
ANALYZE public.login_attempts;
ANALYZE public.webhook_logs;
ANALYZE public.rate_limit_logs;
ANALYZE public.security_events;