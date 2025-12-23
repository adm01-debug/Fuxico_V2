-- Migration: Zapier Integration
-- Feature 3/27: Integração Zapier

CREATE TABLE IF NOT EXISTS public.zapier_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked')),
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event)
);

CREATE TABLE IF NOT EXISTS public.zapier_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.zapier_webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zapier_webhooks_user ON public.zapier_webhooks(user_id);
CREATE INDEX idx_zapier_webhooks_event ON public.zapier_webhooks(event);
CREATE INDEX idx_zapier_webhook_logs_webhook ON public.zapier_webhook_logs(webhook_id);
CREATE INDEX idx_zapier_webhook_logs_created ON public.zapier_webhook_logs(created_at DESC);

ALTER TABLE public.zapier_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks" ON public.zapier_webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own webhook logs" ON public.zapier_webhook_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.zapier_webhooks WHERE id = webhook_id AND user_id = auth.uid())
);
