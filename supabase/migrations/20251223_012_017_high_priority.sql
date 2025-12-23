-- Features 12-17/27: CTA, Custom Domain, PDF Secure, Certificates, No-Reply Alerts, Hot Conversations

-- 12. CTA Tracking
CREATE TABLE IF NOT EXISTS public.cta_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  url TEXT NOT NULL,
  style JSONB DEFAULT '{}',
  tracking_id TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cta_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Custom Domain
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  ssl_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PDF Secure Sharing
CREATE TABLE IF NOT EXISTS public.pdf_share_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_download BOOLEAN DEFAULT true,
  require_email BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  max_views INTEGER,
  current_views INTEGER DEFAULT 0,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Delivery Certificates
CREATE TABLE IF NOT EXISTS public.delivery_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  certificate_url TEXT,
  certificate_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. No-Reply Alerts
CREATE TABLE IF NOT EXISTS public.no_reply_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL,
  alert_after_hours INTEGER NOT NULL CHECK (alert_after_hours IN (24, 48, 72)),
  triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Hot Conversations & Revivals
CREATE TABLE IF NOT EXISTS public.conversation_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('hot', 'revival', 'cold')),
  opens_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cta_buttons_user ON public.cta_buttons(user_id);
CREATE INDEX idx_cta_clicks_tracking ON public.cta_clicks(tracking_id);
CREATE INDEX idx_custom_domains_user ON public.custom_domains(user_id);
CREATE INDEX idx_pdf_share_doc ON public.pdf_share_settings(document_id);
CREATE INDEX idx_delivery_certs_user ON public.delivery_certificates(user_id);
CREATE INDEX idx_no_reply_alerts_user ON public.no_reply_alerts(user_id);
CREATE INDEX idx_conversation_signals_user ON public.conversation_signals(user_id);

-- RLS
ALTER TABLE public.cta_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_share_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_reply_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage cta" ON public.cta_buttons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone insert clicks" ON public.cta_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users manage domains" ON public.custom_domains FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage pdf share" ON public.pdf_share_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage certs" ON public.delivery_certificates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage alerts" ON public.no_reply_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage signals" ON public.conversation_signals FOR ALL USING (auth.uid() = user_id);

-- Function to increment CTA clicks
CREATE OR REPLACE FUNCTION increment_cta_clicks(p_tracking_id TEXT) RETURNS void AS $$
BEGIN UPDATE public.cta_buttons SET clicks = clicks + 1 WHERE tracking_id = p_tracking_id; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
