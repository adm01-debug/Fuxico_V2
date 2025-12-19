-- Migration: Tabela de preferências do usuário com configuração Bitrix24
-- Versão: 1.1.0
-- Data: 2025-12-19

-- ============================================
-- TABELA DE PREFERÊNCIAS DO USUÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Configuração do Bitrix24
  bitrix24_config jsonb DEFAULT '{
    "webhook_url": null,
    "auto_sync_contacts": true,
    "auto_register_activities": true,
    "auto_create_deals": false,
    "send_notifications": true,
    "default_deal_stage": "NEW",
    "default_deal_category": "0"
  }'::jsonb,
  
  -- Configurações de notificação
  notification_preferences jsonb DEFAULT '{
    "email_opens": true,
    "link_clicks": true,
    "document_views": true,
    "daily_summary": true,
    "weekly_report": true
  }'::jsonb,
  
  -- Configurações de webhooks externos
  webhook_config jsonb DEFAULT '{
    "enabled": false,
    "url": null,
    "secret": null,
    "events": ["email_open", "link_click", "document_view"]
  }'::jsonb,
  
  -- Preferências de UI
  ui_preferences jsonb DEFAULT '{
    "theme": "system",
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "date_format": "DD/MM/YYYY"
  }'::jsonb,
  
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role full access preferences" ON public.user_preferences
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABELA DE LOG DE SINCRONIZAÇÃO BITRIX24
-- ============================================

CREATE TABLE IF NOT EXISTS public.bitrix24_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  tracking_id text,
  email text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  request_data jsonb,
  response_data jsonb
);

CREATE INDEX IF NOT EXISTS idx_bitrix24_sync_logs_user_id ON public.bitrix24_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bitrix24_sync_logs_created_at ON public.bitrix24_sync_logs(created_at);

ALTER TABLE public.bitrix24_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs" ON public.bitrix24_sync_logs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manage sync logs" ON public.bitrix24_sync_logs
FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.user_preferences IS 'Preferências do usuário incluindo configuração do Bitrix24';
COMMENT ON TABLE public.bitrix24_sync_logs IS 'Log de sincronizações com Bitrix24';
