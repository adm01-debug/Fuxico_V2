-- Onda 35: Integridade de dados + índices de performance

-- 1) CHECK em alert_dispatch_log.status
ALTER TABLE public.alert_dispatch_log
  DROP CONSTRAINT IF EXISTS alert_dispatch_log_status_ck;
ALTER TABLE public.alert_dispatch_log
  ADD CONSTRAINT alert_dispatch_log_status_ck
  CHECK (status IN ('sent','skipped','failed','retry')) NOT VALID;
ALTER TABLE public.alert_dispatch_log VALIDATE CONSTRAINT alert_dispatch_log_status_ck;

-- 2) CHECK em contact_scores.engagement_score (0..100)
UPDATE public.contact_scores
   SET engagement_score = GREATEST(0, LEAST(100, engagement_score))
 WHERE engagement_score < 0 OR engagement_score > 100;

ALTER TABLE public.contact_scores
  DROP CONSTRAINT IF EXISTS contact_scores_engagement_score_ck;
ALTER TABLE public.contact_scores
  ADD CONSTRAINT contact_scores_engagement_score_ck
  CHECK (engagement_score >= 0 AND engagement_score <= 100) NOT VALID;
ALTER TABLE public.contact_scores VALIDATE CONSTRAINT contact_scores_engagement_score_ck;

-- 3) Índice parcial em security_events para consultas do painel admin
CREATE INDEX IF NOT EXISTS idx_security_events_critical_recent
  ON public.security_events (user_id, created_at DESC)
  WHERE severity IN ('high','critical');