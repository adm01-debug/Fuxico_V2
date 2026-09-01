-- Feature 10/27: CRM Nativo
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  list_ids UUID[] DEFAULT '{}',
  last_contacted TIMESTAMPTZ,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE TABLE IF NOT EXISTS public.crm_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_contacts_user ON public.crm_contacts(user_id);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX idx_crm_lists_user ON public.crm_lists(user_id);
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contacts" ON public.crm_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own lists" ON public.crm_lists FOR ALL USING (auth.uid() = user_id);
