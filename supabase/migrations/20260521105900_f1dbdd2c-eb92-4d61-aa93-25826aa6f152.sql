-- Create Gmail configurations table
CREATE TABLE public.gmail_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE public.gmail_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gmail_configurations
CREATE POLICY "Users can manage their own Gmail configs" 
ON public.gmail_configurations 
FOR ALL 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id ON public.tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON public.tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_id ON public.tracked_emails(user_id);

-- Create a view for easy reporting
CREATE OR REPLACE VIEW public.v_tracking_summary AS
SELECT 
    te.id as email_id,
    te.tracking_id,
    te.recipient_email,
    te.subject,
    te.sender_email,
    te.created_at as sent_at,
    te.user_id,
    COUNT(CASE WHEN ev.event_type = 'open' THEN 1 END) as open_count,
    COUNT(CASE WHEN ev.event_type = 'click' THEN 1 END) as click_count,
    MAX(CASE WHEN ev.event_type = 'open' THEN ev.created_at END) as last_opened_at,
    MAX(CASE WHEN ev.event_type = 'click' THEN ev.created_at END) as last_clicked_at
FROM 
    public.tracked_emails te
LEFT JOIN 
    public.tracking_events ev ON te.tracking_id = ev.tracking_id
GROUP BY 
    te.id, te.tracking_id, te.recipient_email, te.subject, te.sender_email, te.created_at, te.user_id;

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for gmail_configurations
CREATE TRIGGER update_gmail_configurations_updated_at
BEFORE UPDATE ON public.gmail_configurations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
