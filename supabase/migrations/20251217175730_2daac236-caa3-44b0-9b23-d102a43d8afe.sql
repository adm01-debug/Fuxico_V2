-- Add user_id column to tracked_emails
ALTER TABLE public.tracked_emails 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow public insert on tracked_emails" ON public.tracked_emails;
DROP POLICY IF EXISTS "Allow public select on tracked_emails" ON public.tracked_emails;

-- Create new RLS policies for user-specific access
CREATE POLICY "Users can view their own tracked emails"
ON public.tracked_emails
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked emails"
ON public.tracked_emails
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked emails"
ON public.tracked_emails
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked emails"
ON public.tracked_emails
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update tracked_links policies to work through tracked_emails relationship
DROP POLICY IF EXISTS "Allow public insert on tracked_links" ON public.tracked_links;
DROP POLICY IF EXISTS "Allow public select on tracked_links" ON public.tracked_links;
DROP POLICY IF EXISTS "Allow public update on tracked_links" ON public.tracked_links;

CREATE POLICY "Users can view their own tracked links"
ON public.tracked_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracked_emails 
    WHERE tracked_emails.tracking_id = tracked_links.tracking_id 
    AND tracked_emails.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own tracked links"
ON public.tracked_links
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tracked_emails 
    WHERE tracked_emails.tracking_id = tracked_links.tracking_id 
    AND tracked_emails.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own tracked links"
ON public.tracked_links
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracked_emails 
    WHERE tracked_emails.tracking_id = tracked_links.tracking_id 
    AND tracked_emails.user_id = auth.uid()
  )
);

-- Update tracking_events policies
DROP POLICY IF EXISTS "Allow public insert on tracking_events" ON public.tracking_events;
DROP POLICY IF EXISTS "Allow public select on tracking_events" ON public.tracking_events;

CREATE POLICY "Users can view their own tracking events"
ON public.tracking_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracked_emails 
    WHERE tracked_emails.tracking_id = tracking_events.tracking_id 
    AND tracked_emails.user_id = auth.uid()
  )
);

-- Allow public insert on tracking_events (for pixel tracking from external sources)
CREATE POLICY "Allow public insert on tracking_events"
ON public.tracking_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);