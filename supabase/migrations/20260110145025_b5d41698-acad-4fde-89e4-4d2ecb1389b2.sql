-- Create email sequences table
CREATE TABLE public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'on_open', 'on_click', 'on_no_response')),
  settings JSONB DEFAULT '{"send_on_weekends": false, "send_hours_start": 9, "send_hours_end": 18, "timezone": "America/Sao_Paulo"}'::jsonb,
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence steps table
CREATE TABLE public.sequence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 1,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  trigger_condition TEXT DEFAULT 'always' CHECK (trigger_condition IN ('always', 'if_not_opened', 'if_not_clicked', 'if_opened', 'if_clicked')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- Create sequence enrollments table
CREATE TABLE public.sequence_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'replied', 'bounced', 'unsubscribed', 'cancelled')),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_step_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence step executions table (tracks each email sent)
CREATE TABLE public.sequence_step_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.sequence_steps(id) ON DELETE CASCADE,
  tracking_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_step_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_sequences
CREATE POLICY "Users can view their own sequences" ON public.email_sequences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sequences" ON public.email_sequences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences" ON public.email_sequences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences" ON public.email_sequences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for sequence_steps (through sequence ownership)
CREATE POLICY "Users can view steps of their sequences" ON public.sequence_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create steps for their sequences" ON public.sequence_steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update steps of their sequences" ON public.sequence_steps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete steps of their sequences" ON public.sequence_steps
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid())
  );

-- RLS policies for sequence_enrollments
CREATE POLICY "Users can view their enrollments" ON public.sequence_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create enrollments" ON public.sequence_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their enrollments" ON public.sequence_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their enrollments" ON public.sequence_enrollments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for sequence_step_executions (through enrollment ownership)
CREATE POLICY "Users can view executions of their enrollments" ON public.sequence_step_executions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sequence_enrollments WHERE id = enrollment_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create executions for their enrollments" ON public.sequence_step_executions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sequence_enrollments WHERE id = enrollment_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update executions of their enrollments" ON public.sequence_step_executions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.sequence_enrollments WHERE id = enrollment_id AND user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_email_sequences_user_id ON public.email_sequences(user_id);
CREATE INDEX idx_email_sequences_status ON public.email_sequences(status);
CREATE INDEX idx_sequence_steps_sequence_id ON public.sequence_steps(sequence_id);
CREATE INDEX idx_sequence_enrollments_sequence_id ON public.sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_user_id ON public.sequence_enrollments(user_id);
CREATE INDEX idx_sequence_enrollments_status ON public.sequence_enrollments(status);
CREATE INDEX idx_sequence_enrollments_next_step ON public.sequence_enrollments(next_step_at) WHERE status = 'active';
CREATE INDEX idx_sequence_step_executions_enrollment_id ON public.sequence_step_executions(enrollment_id);
CREATE INDEX idx_sequence_step_executions_tracking_id ON public.sequence_step_executions(tracking_id);

-- Trigger for updated_at
CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sequence_steps_updated_at
  BEFORE UPDATE ON public.sequence_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sequence_enrollments_updated_at
  BEFORE UPDATE ON public.sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sequence_step_executions_updated_at
  BEFORE UPDATE ON public.sequence_step_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();