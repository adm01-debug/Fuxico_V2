-- Migration: Mail Merge Tables
-- Feature 1/27: Mail Merge com Google Sheets

CREATE TABLE IF NOT EXISTS public.mail_merge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mail_merge_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.mail_merge_templates(id),
  recipients JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'paused', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mail_merge_templates_user ON public.mail_merge_templates(user_id);
CREATE INDEX idx_mail_merge_campaigns_user ON public.mail_merge_campaigns(user_id);
CREATE INDEX idx_mail_merge_campaigns_status ON public.mail_merge_campaigns(status);

ALTER TABLE public.mail_merge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_merge_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates" ON public.mail_merge_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own campaigns" ON public.mail_merge_campaigns FOR ALL USING (auth.uid() = user_id);
