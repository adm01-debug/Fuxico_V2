-- =====================================================
-- FASE 1: OTIMIZAÇÃO CRÍTICA DE PERFORMANCE
-- =====================================================

-- 1. Criar view materializada para estatísticas de emails
CREATE MATERIALIZED VIEW IF NOT EXISTS email_stats_mv AS
SELECT 
  te.id,
  te.tracking_id,
  te.recipient_email,
  te.sender_email,
  te.subject,
  te.created_at,
  te.user_id,
  te.delivery_status,
  te.bounce_type,
  te.bounce_reason,
  te.bounce_detected_at,
  te.metadata,
  COALESCE(stats.open_count, 0) AS open_count,
  COALESCE(stats.click_count, 0) AS click_count,
  COALESCE(stats.unique_opens, 0) AS unique_opens,
  stats.first_opened_at,
  stats.last_opened_at,
  COALESCE(link_stats.total_link_clicks, 0) AS total_link_clicks,
  COALESCE(link_stats.unique_links_clicked, 0) AS unique_links_clicked
FROM tracked_emails te
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'open') AS open_count,
    COUNT(*) FILTER (WHERE event_type = 'click') AS click_count,
    COUNT(DISTINCT ip_address) FILTER (WHERE event_type = 'open') AS unique_opens,
    MIN(created_at) FILTER (WHERE event_type = 'open') AS first_opened_at,
    MAX(created_at) FILTER (WHERE event_type = 'open') AS last_opened_at
  FROM tracking_events ev
  WHERE ev.tracking_id = te.tracking_id
) stats ON true
LEFT JOIN LATERAL (
  SELECT 
    SUM(COALESCE(click_count, 0)) AS total_link_clicks,
    COUNT(*) FILTER (WHERE click_count > 0) AS unique_links_clicked
  FROM tracked_links tl
  WHERE tl.tracking_id = te.tracking_id
) link_stats ON true;

-- 2. Criar índice único para refresh concorrente
CREATE UNIQUE INDEX IF NOT EXISTS email_stats_mv_id_idx ON email_stats_mv(id);

-- 3. Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS email_stats_mv_user_id_idx ON email_stats_mv(user_id);
CREATE INDEX IF NOT EXISTS email_stats_mv_tracking_id_idx ON email_stats_mv(tracking_id);
CREATE INDEX IF NOT EXISTS email_stats_mv_created_at_idx ON email_stats_mv(created_at DESC);

-- 4. Criar função RPC para buscar emails com estatísticas (evita N+1)
CREATE OR REPLACE FUNCTION get_emails_with_stats(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tracking_id TEXT,
  recipient_email TEXT,
  sender_email TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID,
  delivery_status TEXT,
  bounce_type TEXT,
  bounce_reason TEXT,
  bounce_detected_at TIMESTAMPTZ,
  metadata JSONB,
  open_count BIGINT,
  click_count BIGINT,
  unique_opens BIGINT,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  total_link_clicks BIGINT,
  unique_links_clicked BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Contar total de registros para paginação
  SELECT COUNT(*) INTO v_total_count
  FROM email_stats_mv esm
  WHERE esm.user_id = p_user_id
    AND (p_status IS NULL OR esm.delivery_status = p_status)
    AND (p_search IS NULL OR 
         esm.recipient_email ILIKE '%' || p_search || '%' OR 
         esm.subject ILIKE '%' || p_search || '%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date);

  RETURN QUERY
  SELECT 
    esm.id,
    esm.tracking_id,
    esm.recipient_email,
    esm.sender_email,
    esm.subject,
    esm.created_at,
    esm.user_id,
    esm.delivery_status,
    esm.bounce_type,
    esm.bounce_reason,
    esm.bounce_detected_at,
    esm.metadata,
    esm.open_count,
    esm.click_count,
    esm.unique_opens,
    esm.first_opened_at,
    esm.last_opened_at,
    esm.total_link_clicks,
    esm.unique_links_clicked,
    v_total_count AS total_count
  FROM email_stats_mv esm
  WHERE esm.user_id = p_user_id
    AND (p_status IS NULL OR esm.delivery_status = p_status)
    AND (p_search IS NULL OR 
         esm.recipient_email ILIKE '%' || p_search || '%' OR 
         esm.subject ILIKE '%' || p_search || '%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date)
  ORDER BY esm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 5. Criar função para refresh da view materializada
CREATE OR REPLACE FUNCTION refresh_email_stats_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY email_stats_mv;
END;
$$;

-- 6. Criar função para estatísticas agregadas do usuário
CREATE OR REPLACE FUNCTION get_user_tracking_stats(p_user_id UUID)
RETURNS TABLE (
  total_emails BIGINT,
  total_opens BIGINT,
  total_clicks BIGINT,
  total_bounces BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_emails,
    SUM(esm.open_count)::BIGINT AS total_opens,
    SUM(esm.click_count)::BIGINT AS total_clicks,
    COUNT(*) FILTER (WHERE esm.delivery_status = 'bounced')::BIGINT AS total_bounces,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE esm.open_count > 0)::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END AS open_rate,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE esm.click_count > 0)::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END AS click_rate,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE esm.delivery_status = 'bounced')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END AS bounce_rate
  FROM email_stats_mv esm
  WHERE esm.user_id = p_user_id;
END;
$$;

-- 7. Criar índices nas tabelas base para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id ON tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_id ON tracked_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_created_at ON tracked_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_delivery_status ON tracked_emails(delivery_status);
CREATE INDEX IF NOT EXISTS idx_tracked_links_tracking_id ON tracked_links(tracking_id);

-- 8. Grant permissions
GRANT SELECT ON email_stats_mv TO authenticated;
GRANT EXECUTE ON FUNCTION get_emails_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tracking_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_email_stats_mv TO authenticated;