-- Create standalone tracked links table
CREATE TABLE public.standalone_tracked_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  link_id TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standalone_tracked_links ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own links" 
ON public.standalone_tracked_links FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links" 
ON public.standalone_tracked_links FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" 
ON public.standalone_tracked_links FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
ON public.standalone_tracked_links FOR DELETE 
USING (auth.uid() = user_id);

-- Create link click events table
CREATE TABLE public.link_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.link_click_events ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for tracking
CREATE POLICY "Allow public insert on link_click_events" 
ON public.link_click_events FOR INSERT 
WITH CHECK (true);

-- Users can view events for their own links
CREATE POLICY "Users can view their own link events" 
ON public.link_click_events FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM standalone_tracked_links 
  WHERE standalone_tracked_links.link_id = link_click_events.link_id 
  AND standalone_tracked_links.user_id = auth.uid()
));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.link_click_events;