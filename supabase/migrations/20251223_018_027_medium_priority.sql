-- Features 18-27: Média Prioridade

-- 18. Polls & Surveys
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  multiple_choice BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  voter_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Team Billing
CREATE TABLE IF NOT EXISTS public.team_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  team_name TEXT NOT NULL,
  seats INTEGER DEFAULT 5,
  used_seats INTEGER DEFAULT 1,
  plan TEXT DEFAULT 'team',
  billing_email TEXT NOT NULL,
  stripe_customer_id TEXT,
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.team_billing(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ
);

-- 20. Scheduled Emails (enhanced)
CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  tracking_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Reply Monitors
CREATE TABLE IF NOT EXISTS public.reply_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL,
  recipient TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  replied BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  response_time_hours NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Incoming Trackers
CREATE TABLE IF NOT EXISTS public.incoming_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  subject TEXT,
  detected_pixels INTEGER DEFAULT 0,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. (Activity Dashboard uses existing tables)

-- 24. (Batch Send uses existing campaign tables)

-- 25. Mail Merge Fallbacks (add column to user_preferences)
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS mail_merge_fallbacks JSONB DEFAULT '{}';

-- 26. Email Signatures
CREATE TABLE IF NOT EXISTS public.email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Email Templates v2 (enhanced)
CREATE TABLE IF NOT EXISTS public.email_templates_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  shared BOOLEAN DEFAULT false,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polls_user ON public.polls(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_team_billing_owner ON public.team_billing(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user ON public.scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON public.scheduled_emails(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reply_monitors_user ON public.reply_monitors(user_id);
CREATE INDEX IF NOT EXISTS idx_incoming_trackers_user ON public.incoming_trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_signatures_user ON public.email_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_v2_user ON public.email_templates_v2(user_id);

-- RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage polls" ON public.polls FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can vote" ON public.poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users manage team" ON public.team_billing FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Team owners manage members" ON public.team_members FOR ALL USING (EXISTS (SELECT 1 FROM public.team_billing WHERE id = team_id AND owner_id = auth.uid()));
CREATE POLICY "Users manage scheduled" ON public.scheduled_emails FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage monitors" ON public.reply_monitors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage trackers" ON public.incoming_trackers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage signatures" ON public.email_signatures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage templates" ON public.email_templates_v2 FOR ALL USING (auth.uid() = user_id OR shared = true);

-- Function to increment template uses
CREATE OR REPLACE FUNCTION increment_template_uses(template_id UUID) RETURNS void AS $$
BEGIN UPDATE public.email_templates_v2 SET uses_count = uses_count + 1 WHERE id = template_id; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
