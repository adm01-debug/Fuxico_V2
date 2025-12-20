-- Create unsubscribed_emails table
CREATE TABLE public.unsubscribed_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'link', 'bounce', 'complaint')),
  tracking_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unsubscribed_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own unsubscribed emails"
ON public.unsubscribed_emails FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unsubscribed emails"
ON public.unsubscribed_emails FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unsubscribed emails"
ON public.unsubscribed_emails FOR DELETE
USING (auth.uid() = user_id);

-- Allow public insert for opt-out links
CREATE POLICY "Allow public unsubscribe via link"
ON public.unsubscribed_emails FOR INSERT
WITH CHECK (source = 'link');

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_unsubscribed_emails_unique ON public.unsubscribed_emails(user_id, email);

-- Create indexes
CREATE INDEX idx_unsubscribed_emails_user_id ON public.unsubscribed_emails(user_id);
CREATE INDEX idx_unsubscribed_emails_email ON public.unsubscribed_emails(email);