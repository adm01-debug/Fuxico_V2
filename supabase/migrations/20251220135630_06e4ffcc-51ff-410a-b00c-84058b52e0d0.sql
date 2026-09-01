-- =============================================================================
-- FUXICO - Webhook Configuration Tables
-- =============================================================================

-- Tabela de configuração de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT ARRAY['email_open', 'link_click', 'bounce'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.webhook_configs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  tracking_id TEXT,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_configs
CREATE POLICY "Users can view their own webhook config" 
ON public.webhook_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook config" 
ON public.webhook_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook config" 
ON public.webhook_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook config" 
ON public.webhook_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for webhook_logs
CREATE POLICY "Users can view their own webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook logs" 
ON public.webhook_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_configs_user_id ON public.webhook_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_webhook_configs_updated_at
BEFORE UPDATE ON public.webhook_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();