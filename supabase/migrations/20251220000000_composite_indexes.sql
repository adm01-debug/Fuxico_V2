-- =============================================================================
-- FUXICO - Migration: Índices Compostos para Otimização de Queries
-- Arquivo: supabase/migrations/20251220000000_composite_indexes.sql
-- Descrição: Adiciona índices compostos para queries frequentes
-- =============================================================================

-- =============================================================================
-- ÍNDICES PARA tracked_emails
-- =============================================================================

-- Índice composto principal: filtro por usuário + status + ordenação por data
-- Usado em: Dashboard, filtros de email, exportações
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_status_created
  ON public.tracked_emails (user_id, delivery_status, created_at DESC);

-- Índice para busca por email do destinatário (com trigram para LIKE/ILIKE)
-- Requer extensão pg_trgm habilitada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tracked_emails_recipient_trgm 
      ON public.tracked_emails USING gin (recipient_email gin_trgm_ops)';
  END IF;
END $$;

-- Índice para busca por subject
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tracked_emails_subject_trgm 
      ON public.tracked_emails USING gin (subject gin_trgm_ops)';
  END IF;
END $$;

-- Índice para emails bounced (usado em relatórios)
CREATE INDEX IF NOT EXISTS idx_tracked_emails_bounced
  ON public.tracked_emails (user_id, bounce_detected_at DESC)
  WHERE delivery_status = 'bounced';

-- =============================================================================
-- ÍNDICES PARA tracking_events
-- =============================================================================

-- Índice composto: tipo de evento + data (para estatísticas)
CREATE INDEX IF NOT EXISTS idx_tracking_events_type_created
  ON public.tracking_events (event_type, created_at DESC);

-- Índice para eventos por tracking_id + tipo (para contagem)
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_type
  ON public.tracking_events (tracking_id, event_type);

-- Índice para filtrar self-opens em queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_not_self_open
  ON public.tracking_events (tracking_id, event_type, created_at DESC)
  WHERE is_self_open = false;

-- Índice para IP (usado em detecção de fraude e geolocalização)
CREATE INDEX IF NOT EXISTS idx_tracking_events_ip
  ON public.tracking_events (ip_address)
  WHERE ip_address IS NOT NULL;

-- =============================================================================
-- ÍNDICES PARA tracked_links
-- =============================================================================

-- Índice composto para links por tracking_id
CREATE INDEX IF NOT EXISTS idx_tracked_links_tracking_created
  ON public.tracked_links (tracking_id, created_at DESC);

-- Índice para busca por URL original
CREATE INDEX IF NOT EXISTS idx_tracked_links_original_url
  ON public.tracked_links (original_url);

-- =============================================================================
-- ÍNDICES PARA tracked_documents
-- =============================================================================

-- Índice composto: usuário + data
CREATE INDEX IF NOT EXISTS idx_tracked_documents_user_created
  ON public.tracked_documents (user_id, created_at DESC);

-- Índice para busca por nome do documento
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tracked_documents_name_trgm 
      ON public.tracked_documents USING gin (file_name gin_trgm_ops)';
  END IF;
END $$;

-- =============================================================================
-- ÍNDICES PARA email_audit_logs
-- =============================================================================

-- Índice composto para auditoria: usuário + timestamp + direção
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time_direction
  ON public.email_audit_logs (user_id, timestamp DESC, direction);

-- Índice para busca por ação
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.email_audit_logs (action, timestamp DESC);

-- =============================================================================
-- ÍNDICES PARA fraud_alerts
-- =============================================================================

-- Índice composto para alertas não resolvidos
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_unresolved
  ON public.fraud_alerts (user_id, created_at DESC)
  WHERE is_resolved = false;

-- Índice por tipo de alerta
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_type_created
  ON public.fraud_alerts (alert_type, created_at DESC);

-- =============================================================================
-- ÍNDICES PARA webhook_logs
-- =============================================================================

-- Índice composto para logs por usuário + status
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_status
  ON public.webhook_logs (user_id, status, created_at DESC);

-- Índice para logs com falha (para retry)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_failed
  ON public.webhook_logs (created_at DESC)
  WHERE status = 'failed';

-- =============================================================================
-- ÍNDICES PARA bitrix24_sync_logs
-- =============================================================================

-- Índice composto para logs de sync
CREATE INDEX IF NOT EXISTS idx_bitrix_logs_user_status_created
  ON public.bitrix24_sync_logs (user_id, sync_status, created_at DESC);

-- =============================================================================
-- ÍNDICES PARA email_stats_mv (View Materializada)
-- =============================================================================

-- Índice para busca por email
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_stats_mv_recipient_trgm 
      ON public.email_stats_mv USING gin (recipient_email gin_trgm_ops)';
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- View materializada pode não existir ainda
  NULL;
END $$;

-- =============================================================================
-- HABILITAR EXTENSÃO pg_trgm (se não habilitada)
-- =============================================================================

-- Esta extensão permite buscas fuzzy com LIKE/ILIKE otimizadas
-- Executar com superuser se necessário:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- ESTATÍSTICAS
-- =============================================================================

-- Atualizar estatísticas após criar índices
ANALYZE public.tracked_emails;
ANALYZE public.tracking_events;
ANALYZE public.tracked_links;
ANALYZE public.tracked_documents;
ANALYZE public.email_audit_logs;
ANALYZE public.fraud_alerts;

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON INDEX idx_tracked_emails_user_status_created IS 
  'Índice composto para filtros de email no dashboard (user + status + date)';

COMMENT ON INDEX idx_tracking_events_type_created IS 
  'Índice para estatísticas por tipo de evento';

COMMENT ON INDEX idx_tracking_events_not_self_open IS 
  'Índice parcial para excluir self-opens das estatísticas';
