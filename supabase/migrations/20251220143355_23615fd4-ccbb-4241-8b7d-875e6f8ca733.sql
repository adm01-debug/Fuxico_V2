-- Create follow_up_reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tracking_id TEXT NOT NULL REFERENCES public.tracked_emails(tracking_id) ON DELETE CASCADE,
  reminder_days INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  reminded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'cancelled', 'opened'))
);

-- Enable RLS
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reminders"
ON public.follow_up_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
ON public.follow_up_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.follow_up_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.follow_up_reminders FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_follow_up_reminders_updated_at
BEFORE UPDATE ON public.follow_up_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_follow_up_reminders_user_status ON public.follow_up_reminders(user_id, status);
CREATE INDEX idx_follow_up_reminders_tracking ON public.follow_up_reminders(tracking_id);

-- Function to get pending reminders that are due
CREATE OR REPLACE FUNCTION public.get_due_reminders()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  tracking_id TEXT,
  reminder_days INTEGER,
  recipient_email TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.user_id,
    fr.tracking_id,
    fr.reminder_days,
    te.recipient_email,
    te.subject,
    te.created_at
  FROM follow_up_reminders fr
  JOIN tracked_emails te ON fr.tracking_id = te.tracking_id
  LEFT JOIN email_stats_mv esm ON te.tracking_id = esm.tracking_id
  WHERE fr.status = 'pending'
    AND (esm.open_count IS NULL OR esm.open_count = 0)
    AND te.created_at + (fr.reminder_days || ' days')::INTERVAL <= now();
END;
$$;

-- Enable realtime for follow_up_reminders
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_up_reminders;