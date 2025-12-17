-- Create table for tracked emails
CREATE TABLE public.tracked_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sender_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create table for tracking events (opens, clicks)
CREATE TABLE public.tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL REFERENCES public.tracked_emails(tracking_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create table for wrapped links
CREATE TABLE public.tracked_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL REFERENCES public.tracked_emails(tracking_id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  link_id TEXT NOT NULL UNIQUE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_tracking_events_tracking_id ON public.tracking_events(tracking_id);
CREATE INDEX idx_tracking_events_created_at ON public.tracking_events(created_at);
CREATE INDEX idx_tracked_links_tracking_id ON public.tracked_links(tracking_id);
CREATE INDEX idx_tracked_emails_created_at ON public.tracked_emails(created_at);

-- Enable RLS
ALTER TABLE public.tracked_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for tracking (edge functions need access)
CREATE POLICY "Allow public insert on tracked_emails" ON public.tracked_emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on tracked_emails" ON public.tracked_emails FOR SELECT USING (true);

CREATE POLICY "Allow public insert on tracking_events" ON public.tracking_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on tracking_events" ON public.tracking_events FOR SELECT USING (true);

CREATE POLICY "Allow public insert on tracked_links" ON public.tracked_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on tracked_links" ON public.tracked_links FOR SELECT USING (true);
CREATE POLICY "Allow public update on tracked_links" ON public.tracked_links FOR UPDATE USING (true);

-- Enable realtime for tracking events
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;