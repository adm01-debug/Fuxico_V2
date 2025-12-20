-- ============================================
-- 1. Tabela bitrix24_config para persistir configurações
-- ============================================

CREATE TABLE IF NOT EXISTS public.bitrix24_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT,
  auto_sync_contacts BOOLEAN NOT NULL DEFAULT true,
  auto_register_activities BOOLEAN NOT NULL DEFAULT true,
  auto_create_deals BOOLEAN NOT NULL DEFAULT false,
  send_notifications BOOLEAN NOT NULL DEFAULT true,
  default_deal_stage TEXT NOT NULL DEFAULT 'NEW',
  default_deal_category TEXT NOT NULL DEFAULT '0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.bitrix24_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own bitrix24 config"
  ON public.bitrix24_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bitrix24 config"
  ON public.bitrix24_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bitrix24 config"
  ON public.bitrix24_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bitrix24 config"
  ON public.bitrix24_config FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_bitrix24_config_updated_at
  BEFORE UPDATE ON public.bitrix24_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Tabela scheduled_emails para agendamento
-- ============================================

CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  sender_email TEXT,
  subject TEXT NOT NULL,
  body TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  tracking_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own scheduled emails"
  ON public.scheduled_emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled emails"
  ON public.scheduled_emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled emails"
  ON public.scheduled_emails FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled emails"
  ON public.scheduled_emails FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_emails_updated_at
  BEFORE UPDATE ON public.scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON public.scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON public.scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON public.scheduled_emails(scheduled_at);

-- ============================================
-- 3. Função para obter estatísticas geográficas
-- ============================================

CREATE OR REPLACE FUNCTION public.get_geo_stats(p_user_id UUID)
RETURNS TABLE (
  country TEXT,
  city TEXT,
  open_count BIGINT,
  click_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(te.metadata->>'country', 'Unknown')::TEXT as country,
    COALESCE(te.metadata->>'city', 'Unknown')::TEXT as city,
    COUNT(*) FILTER (WHERE te.event_type = 'open')::BIGINT as open_count,
    COUNT(*) FILTER (WHERE te.event_type = 'click')::BIGINT as click_count
  FROM tracking_events te
  INNER JOIN tracked_emails em ON te.tracking_id = em.tracking_id
  WHERE em.user_id = p_user_id
    AND te.metadata IS NOT NULL
    AND te.metadata->>'country' IS NOT NULL
  GROUP BY 
    COALESCE(te.metadata->>'country', 'Unknown'),
    COALESCE(te.metadata->>'city', 'Unknown')
  ORDER BY COUNT(*) DESC
  LIMIT 100;
END;
$$;