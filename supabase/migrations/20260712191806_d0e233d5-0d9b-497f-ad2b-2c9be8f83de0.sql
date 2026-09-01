
-- ============================================================================
-- Onda 4 — Recriar email_stats_mv com refresh CONCURRENTLY + agendamento
-- ============================================================================

CREATE MATERIALIZED VIEW public.email_stats_mv AS
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
  COALESCE(ev.open_count, 0)::BIGINT           AS open_count,
  COALESCE(ev.click_count, 0)::BIGINT          AS click_count,
  COALESCE(ev.unique_opens, 0)::BIGINT         AS unique_opens,
  ev.first_opened_at,
  ev.last_opened_at,
  COALESCE(lk.total_link_clicks, 0)::BIGINT    AS total_link_clicks,
  COALESCE(lk.unique_links_clicked, 0)::BIGINT AS unique_links_clicked
FROM public.tracked_emails te
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE event_type='open')  AS open_count,
    COUNT(*) FILTER (WHERE event_type='click') AS click_count,
    COUNT(DISTINCT (metadata->>'fingerprint')) FILTER (WHERE event_type='open') AS unique_opens,
    MIN(created_at) FILTER (WHERE event_type='open') AS first_opened_at,
    MAX(created_at) FILTER (WHERE event_type='open') AS last_opened_at
  FROM public.tracking_events
  WHERE tracking_id = te.tracking_id
) ev ON TRUE
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                          AS total_link_clicks,
    COUNT(DISTINCT link_id)           AS unique_links_clicked
  FROM public.link_click_events
  WHERE tracking_id = te.tracking_id
) lk ON TRUE;

-- Índice UNIQUE obrigatório para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_email_stats_mv_id ON public.email_stats_mv (id);
CREATE INDEX idx_email_stats_mv_user_created ON public.email_stats_mv (user_id, created_at DESC);
CREATE INDEX idx_email_stats_mv_user_status ON public.email_stats_mv (user_id, delivery_status);
CREATE INDEX idx_email_stats_mv_tracking_id ON public.email_stats_mv (tracking_id);
CREATE INDEX idx_email_stats_mv_recipient_trgm ON public.email_stats_mv USING gin (recipient_email extensions.gin_trgm_ops);
CREATE INDEX idx_email_stats_mv_subject_trgm ON public.email_stats_mv USING gin (subject extensions.gin_trgm_ops);

-- MV não suporta RLS diretamente; acesso é feito via SECURITY DEFINER RPCs
REVOKE ALL ON public.email_stats_mv FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.email_stats_mv TO service_role;

-- Refresh function robusta (fallback para non-concurrent se primeira vez ou lock)
CREATE OR REPLACE FUNCTION public.refresh_email_stats_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.email_stats_mv;
  EXCEPTION WHEN OTHERS THEN
    -- Se CONCURRENTLY falhar (ex: sem dados iniciais), tenta non-concurrent
    REFRESH MATERIALIZED VIEW public.email_stats_mv;
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_email_stats_mv() FROM PUBLIC, anon, authenticated;

-- Agendamento: refresh a cada 2 minutos via pg_cron
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('refresh-email-stats-mv')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='refresh-email-stats-mv');
    PERFORM cron.schedule(
      'refresh-email-stats-mv',
      '*/2 * * * *',
      $cron$SELECT public.refresh_email_stats_mv();$cron$
    );
  END IF;
END$$;
