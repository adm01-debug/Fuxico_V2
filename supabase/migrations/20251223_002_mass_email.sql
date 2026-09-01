-- Migration: Mass Email Campaigns
-- Feature 2/27: Campanhas de Email em Massa (60k/mês)

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  recipients JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled')),
  total_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  batch_size INTEGER DEFAULT 50,
  batch_delay_ms INTEGER DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_user ON public.email_campaigns(user_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_created ON public.email_campaigns(created_at DESC);
CREATE INDEX idx_campaign_events_campaign ON public.campaign_events(campaign_id);
CREATE INDEX idx_campaign_events_type ON public.campaign_events(event_type);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaigns" ON public.email_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own campaign events" ON public.campaign_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.email_campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
