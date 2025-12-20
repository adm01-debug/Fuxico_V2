-- Create ab_tests table
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
  variant_a_subject TEXT NOT NULL,
  variant_b_subject TEXT NOT NULL,
  variant_a_sends INTEGER NOT NULL DEFAULT 0,
  variant_b_sends INTEGER NOT NULL DEFAULT 0,
  variant_a_opens INTEGER NOT NULL DEFAULT 0,
  variant_b_opens INTEGER NOT NULL DEFAULT 0,
  variant_a_clicks INTEGER NOT NULL DEFAULT 0,
  variant_b_clicks INTEGER NOT NULL DEFAULT 0,
  winner TEXT CHECK (winner IN ('A', 'B', NULL)),
  recipient_email TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own ab tests"
ON public.ab_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ab tests"
ON public.ab_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ab tests"
ON public.ab_tests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ab tests"
ON public.ab_tests FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ab_tests_updated_at
BEFORE UPDATE ON public.ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_ab_tests_user_id ON public.ab_tests(user_id);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);