-- Migration: Tabela de logs de webhook e trigger para disparar webhooks
-- Versão: 1.1.0
-- Data: 2025-12-19

-- ============================================
-- TABELA DE LOGS DE WEBHOOK
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  event_type text NOT NULL,
  tracking_id text,
  webhook_url text NOT NULL,
  
  success boolean NOT NULL DEFAULT false,
  status_code integer,
  error_message text,
  
  request_payload jsonb,
  response_body text
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);

-- RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook logs" ON public.webhook_logs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manage webhook logs" ON public.webhook_logs
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- FUNÇÃO PARA NOTIFICAR SOBRE NOVOS EVENTOS
-- ============================================

-- Esta função será chamada após INSERT em tracking_events
-- para disparar webhooks assincronamente

CREATE OR REPLACE FUNCTION public.notify_tracking_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_webhook_config jsonb;
BEGIN
  -- Buscar user_id do email rastreado
  SELECT user_id INTO v_user_id
  FROM public.tracked_emails
  WHERE tracking_id = NEW.tracking_id;
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar configuração de webhook
  SELECT webhook_config INTO v_webhook_config
  FROM public.user_preferences
  WHERE user_id = v_user_id;
  
  -- Se webhook está habilitado, notificar via pg_notify
  IF v_webhook_config IS NOT NULL AND 
     (v_webhook_config->>'enabled')::boolean = true AND
     v_webhook_config->>'url' IS NOT NULL THEN
    
    -- Usar pg_notify para processamento assíncrono
    PERFORM pg_notify('webhook_event', json_build_object(
      'event_type', NEW.event_type,
      'tracking_id', NEW.tracking_id,
      'user_id', v_user_id,
      'timestamp', NEW.created_at,
      'data', json_build_object(
        'ip_address', NEW.ip_address,
        'user_agent', NEW.user_agent,
        'is_self_open', NEW.is_self_open,
        'metadata', NEW.metadata
      )
    )::text);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_tracking_event_notify ON public.tracking_events;
CREATE TRIGGER on_tracking_event_notify
AFTER INSERT ON public.tracking_events
FOR EACH ROW
EXECUTE FUNCTION public.notify_tracking_event();

-- ============================================
-- ATUALIZAR webhook_config NA TABELA user_preferences
-- ============================================

-- Adicionar mais campos ao webhook_config default
UPDATE public.user_preferences
SET webhook_config = jsonb_build_object(
  'enabled', COALESCE((webhook_config->>'enabled')::boolean, false),
  'url', webhook_config->>'url',
  'secret', webhook_config->>'secret',
  'events', COALESCE(webhook_config->'events', '["email_open", "link_click", "document_view"]'::jsonb),
  'retries', COALESCE((webhook_config->>'retries')::integer, 3),
  'timeout', COALESCE((webhook_config->>'timeout')::integer, 10000)
)
WHERE webhook_config IS NOT NULL;

COMMENT ON TABLE public.webhook_logs IS 'Log de todos os webhooks disparados';
COMMENT ON FUNCTION public.notify_tracking_event IS 'Dispara notificação para webhooks quando há novo evento de tracking';
