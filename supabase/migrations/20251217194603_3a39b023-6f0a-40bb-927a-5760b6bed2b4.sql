-- Add is_self_open column to tracking_events for self-open detection
ALTER TABLE public.tracking_events 
ADD COLUMN is_self_open boolean DEFAULT false;

-- Add index for faster filtering
CREATE INDEX idx_tracking_events_self_open ON public.tracking_events(is_self_open);

-- Comment explaining the column
COMMENT ON COLUMN public.tracking_events.is_self_open IS 'True if the open was likely from the email sender (detected by timing or IP matching)';