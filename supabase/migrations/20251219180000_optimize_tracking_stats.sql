-- ============================================================================
-- FUXICO - Migration: Otimização de Performance
-- Versão: 2.0.0
-- Data: 2024-12-19
-- Descrição: Resolve problema N+1 Query em get-tracking-stats
-- ============================================================================

-- ============================================================================
-- PARTE 1: VIEW MATERIALIZADA PARA ESTATÍSTICAS DE EMAIL
-- ============================================================================
-- Esta view agrega todas as estatísticas de email em uma única estrutura,
-- eliminando a necessidade de queries individuais por email.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.email_stats_mv AS
SELECT 
  e.tracking_id,
  e.id as email_id,
  e.user_id,
  e.recipient_email,
  e.subject,
  e.sender_email,
  e.created_at,
  e.metadata,
  e.delivery_status,
  e.bounce_type,
  e.bounce_reason,
  e.bounce_detected_at,
  
  -- Contadores agregados (excluindo self-opens para métricas precisas)
  COALESCE(COUNT(CASE WHEN ev.event_type = 'open' AND ev.is_self_open = false THEN 1 END), 0)::bigint as opens,
  COALESCE(COUNT(CASE WHEN ev.event_type = 'click' AND ev.is_self_open = false THEN 1 END), 0)::bigint as clicks,
  COALESCE(COUNT(CASE WHEN ev.event_type = 'open' AND ev.is_self_open = true THEN 1 END), 0)::bigint as self_opens,
  
  -- Aberturas únicas por IP (evita contagem duplicada de mesma pessoa)
  COALESCE(COUNT(DISTINCT CASE WHEN ev.event_type = 'open' AND ev.is_self_open = false THEN ev.ip_address END), 0)::bigint as unique_opens,
  
  -- Primeiro e último evento (para timeline de engajamento)
  MIN(CASE WHEN ev.event_type = 'open' AND ev.is_self_open = false THEN ev.created_at END) as first_opened_at,
  MAX(CASE WHEN ev.event_type = 'open' AND ev.is_self_open = false THEN ev.created_at END) as last_opened_at
  
FROM 
  public.tracked_emails e
LEFT JOIN 
  public.tracking_events ev ON e.tracking_id = ev.tracking_id
GROUP BY 
  e.id, e.tracking_id, e.user_id, e.recipient_email, e.subject, 
  e.sender_email, e.created_at, e.metadata, e.delivery_status,
  e.bounce_type, e.bounce_reason, e.bounce_detected_at;

-- ============================================================================
-- PARTE 2: ÍNDICES PARA A VIEW MATERIALIZADA
-- ============================================================================
-- Índices otimizados para queries frequentes

-- Índice único obrigatório para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_stats_mv_tracking_id 
  ON public.email_stats_mv (tracking_id);

-- Índice para filtro por usuário (mais comum)
CREATE INDEX IF NOT EXISTS idx_email_stats_mv_user_id 
  ON public.email_stats_mv (user_id);

-- Índice para ordenação por data (padrão DESC para mostrar mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_email_stats_mv_created_at 
  ON public.email_stats_mv (created_at DESC);

-- Índice composto para query principal: filtro por user + ordenação por data
CREATE INDEX IF NOT EXISTS idx_email_stats_mv_user_created 
  ON public.email_stats_mv (user_id, created_at DESC);

-- Índice para busca por status de delivery (filtros de bounced emails)
CREATE INDEX IF NOT EXISTS idx_email_stats_mv_delivery_status 
  ON public.email_stats_mv (user_id, delivery_status);

-- ============================================================================
-- PARTE 3: FUNÇÃO RPC PARA BUSCAR EMAILS COM STATS (SINGLE QUERY)
-- ============================================================================
-- Esta função substitui o Promise.all com N queries por UMA única query

CREATE OR REPLACE FUNCTION public.get_emails_with_stats(
  p_user_id uuid,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_cursor_date timestamptz DEFAULT NULL,
  p_delivery_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  tracking_id text,
  recipient_email text,
  subject text,
  sender_email text,
  created_at timestamptz,
  metadata jsonb,
  delivery_status text,
  bounce_type text,
  bounce_reason text,
  bounce_detected_at timestamptz,
  opens bigint,
  clicks bigint,
  self_opens bigint,
  unique_opens bigint,
  first_opened_at timestamptz,
  last_opened_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.email_id,
    mv.tracking_id,
    mv.recipient_email,
    mv.subject,
    mv.sender_email,
    mv.created_at,
    mv.metadata,
    mv.delivery_status,
    mv.bounce_type,
    mv.bounce_reason,
    mv.bounce_detected_at,
    mv.opens,
    mv.clicks,
    mv.self_opens,
    mv.unique_opens,
    mv.first_opened_at,
    mv.last_opened_at
  FROM public.email_stats_mv mv
  WHERE mv.user_id = p_user_id
    -- Cursor-based pagination (mais eficiente que OFFSET para grandes datasets)
    AND (p_cursor_date IS NULL OR mv.created_at < p_cursor_date)
    -- Filtro opcional por status de entrega
    AND (p_delivery_status IS NULL OR mv.delivery_status = p_delivery_status)
  ORDER BY mv.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_emails_with_stats TO authenticated;

-- ============================================================================
-- PARTE 4: FUNÇÃO PARA REFRESH AUTOMÁTICO DA VIEW
-- ============================================================================
-- Função que pode ser chamada por trigger ou cron job

CREATE OR REPLACE FUNCTION public.refresh_email_stats_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- CONCURRENTLY permite refresh sem bloquear leituras
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.email_stats_mv;
END;
$$;

-- Grant para service role (usado por cron jobs)
GRANT EXECUTE ON FUNCTION public.refresh_email_stats_mv TO service_role;

-- ============================================================================
-- PARTE 5: TRIGGER PARA ATUALIZAÇÃO INCREMENTAL (OPCIONAL)
-- ============================================================================
-- Função para invalidar cache quando há novos eventos
-- Pode ser usada com pg_cron para refresh periódico

CREATE OR REPLACE FUNCTION public.notify_stats_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notifica que há novos eventos (para sistemas de cache externos)
  PERFORM pg_notify('email_stats_updated', json_build_object(
    'tracking_id', NEW.tracking_id,
    'event_type', NEW.event_type,
    'timestamp', now()
  )::text);
  RETURN NEW;
END;
$$;

-- Trigger para notificação (descomentrar para ativar)
-- DROP TRIGGER IF EXISTS trg_tracking_events_notify ON public.tracking_events;
-- CREATE TRIGGER trg_tracking_events_notify
--   AFTER INSERT ON public.tracking_events
--   FOR EACH ROW
--   EXECUTE FUNCTION public.notify_stats_update();

-- ============================================================================
-- PARTE 6: CONFIGURAÇÃO DE CRON JOB (pg_cron)
-- ============================================================================
-- Refresh automático a cada 5 minutos (requer extensão pg_cron)
-- Execute apenas se pg_cron estiver instalado:

-- SELECT cron.schedule(
--   'refresh-email-stats-mv',
--   '*/5 * * * *',
--   $$SELECT public.refresh_email_stats_mv()$$
-- );

-- ============================================================================
-- PARTE 7: REFRESH INICIAL
-- ============================================================================

REFRESH MATERIALIZED VIEW public.email_stats_mv;

-- ============================================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON MATERIALIZED VIEW public.email_stats_mv IS 
  'View materializada com estatísticas agregadas de emails. Resolve problema N+1.';

COMMENT ON FUNCTION public.get_emails_with_stats IS 
  'RPC para buscar emails com estatísticas em uma única query. Suporta paginação cursor-based.';

COMMENT ON FUNCTION public.refresh_email_stats_mv IS 
  'Função para refresh da view materializada. Usar CONCURRENTLY para não bloquear leituras.';
