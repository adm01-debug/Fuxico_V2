-- Feature 11/27: Email Productivity Reports
CREATE TABLE IF NOT EXISTS public.scheduled_productivity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period)
);

CREATE TABLE IF NOT EXISTS public.productivity_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reports_user ON public.scheduled_productivity_reports(user_id);
ALTER TABLE public.scheduled_productivity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_report_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reports" ON public.scheduled_productivity_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own history" ON public.productivity_report_history FOR ALL USING (auth.uid() = user_id);
