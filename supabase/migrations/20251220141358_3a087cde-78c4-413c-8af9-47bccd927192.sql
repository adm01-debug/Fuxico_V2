-- =============================================================================
-- FUXICO - Lead Scoring e Contact Analytics (correção)
-- =============================================================================

-- Tabela para armazenar scores de contatos
CREATE TABLE public.contact_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  total_emails_sent INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_bounces INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  first_interaction_at TIMESTAMP WITH TIME ZONE,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  engagement_score INTEGER DEFAULT 0,
  score_level TEXT DEFAULT 'cold',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE public.contact_scores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own contact scores"
  ON public.contact_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact scores"
  ON public.contact_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact scores"
  ON public.contact_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact scores"
  ON public.contact_scores FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_contact_scores_updated_at
  BEFORE UPDATE ON public.contact_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular e atualizar score de um contato
CREATE OR REPLACE FUNCTION public.update_contact_score(p_user_id UUID, p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_emails INTEGER;
  v_total_opens INTEGER;
  v_total_clicks INTEGER;
  v_total_bounces INTEGER;
  v_unique_opens INTEGER;
  v_first_interaction TIMESTAMP WITH TIME ZONE;
  v_last_interaction TIMESTAMP WITH TIME ZONE;
  v_score INTEGER;
  v_level TEXT;
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(esm.open_count), 0),
    COALESCE(SUM(esm.click_count), 0),
    COUNT(*) FILTER (WHERE esm.delivery_status = 'bounced'),
    COUNT(*) FILTER (WHERE esm.open_count > 0),
    MIN(esm.created_at),
    MAX(GREATEST(esm.last_opened_at, esm.created_at))
  INTO 
    v_total_emails, v_total_opens, v_total_clicks,
    v_total_bounces, v_unique_opens, v_first_interaction, v_last_interaction
  FROM email_stats_mv esm
  WHERE esm.user_id = p_user_id AND esm.recipient_email = p_email;

  v_score := 0;
  
  IF v_total_emails > 0 THEN
    v_score := v_score + LEAST(40, (v_unique_opens::FLOAT / v_total_emails) * 40);
    v_score := v_score + LEAST(40, (v_total_clicks::FLOAT / GREATEST(v_total_opens, 1)) * 40);
    IF v_last_interaction IS NOT NULL THEN
      v_score := v_score + GREATEST(0, 20 - EXTRACT(DAY FROM (now() - v_last_interaction)));
    END IF;
  END IF;

  v_score := GREATEST(0, v_score - (v_total_bounces * 10));

  v_level := CASE 
    WHEN v_score >= 70 THEN 'hot'
    WHEN v_score >= 40 THEN 'warm'
    WHEN v_score >= 20 THEN 'cool'
    ELSE 'cold'
  END;

  INSERT INTO contact_scores (
    user_id, email, total_emails_sent, total_opens, total_clicks,
    total_bounces, unique_opens, first_interaction_at, last_interaction_at,
    engagement_score, score_level
  ) VALUES (
    p_user_id, p_email, v_total_emails, v_total_opens, v_total_clicks,
    v_total_bounces, v_unique_opens, v_first_interaction, v_last_interaction,
    v_score, v_level
  )
  ON CONFLICT (user_id, email) DO UPDATE SET
    total_emails_sent = EXCLUDED.total_emails_sent,
    total_opens = EXCLUDED.total_opens,
    total_clicks = EXCLUDED.total_clicks,
    total_bounces = EXCLUDED.total_bounces,
    unique_opens = EXCLUDED.unique_opens,
    first_interaction_at = EXCLUDED.first_interaction_at,
    last_interaction_at = EXCLUDED.last_interaction_at,
    engagement_score = EXCLUDED.engagement_score,
    score_level = EXCLUDED.score_level,
    updated_at = now();
END;
$$;

-- Função para recalcular todos os scores
CREATE OR REPLACE FUNCTION public.recalculate_all_contact_scores(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR v_email IN 
    SELECT DISTINCT recipient_email FROM tracked_emails WHERE user_id = p_user_id
  LOOP
    PERFORM update_contact_score(p_user_id, v_email);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;