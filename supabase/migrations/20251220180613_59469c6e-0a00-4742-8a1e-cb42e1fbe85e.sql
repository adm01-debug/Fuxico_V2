-- Create scheduled_reports table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly' CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  format TEXT NOT NULL DEFAULT 'email' CHECK (format IN ('email', 'pdf', 'csv')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  metrics TEXT[] NOT NULL DEFAULT ARRAY['emails_sent', 'opens', 'clicks'],
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled reports"
ON public.scheduled_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled reports"
ON public.scheduled_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled reports"
ON public.scheduled_reports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled reports"
ON public.scheduled_reports FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_reports_updated_at
BEFORE UPDATE ON public.scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX idx_scheduled_reports_user_id ON public.scheduled_reports(user_id);
CREATE INDEX idx_scheduled_reports_next_send ON public.scheduled_reports(next_send_at) WHERE enabled = true;