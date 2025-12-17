-- Add delivery status column to tracked_emails
ALTER TABLE public.tracked_emails 
ADD COLUMN delivery_status text DEFAULT 'sent',
ADD COLUMN bounce_type text,
ADD COLUMN bounce_reason text,
ADD COLUMN bounce_detected_at timestamp with time zone;

-- Create index for filtering by status
CREATE INDEX idx_tracked_emails_delivery_status ON public.tracked_emails(delivery_status);