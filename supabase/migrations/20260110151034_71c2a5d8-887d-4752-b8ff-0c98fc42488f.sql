-- Create function to increment completed sequences count (used by edge function)
CREATE OR REPLACE FUNCTION public.increment_sequence_completed(seq_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.email_sequences 
  SET total_completed = COALESCE(total_completed, 0) + 1,
      updated_at = now()
  WHERE id = seq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to handle sequence step completion and update enrollments
CREATE OR REPLACE FUNCTION public.update_sequence_on_email_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this email is part of a sequence
  IF NEW.metadata->>'sequence_id' IS NOT NULL THEN
    -- Update the step execution based on event type
    IF NEW.event_type = 'open' THEN
      UPDATE public.sequence_step_executions
      SET opened_at = COALESCE(opened_at, NEW.created_at)
      WHERE tracking_id = NEW.tracking_id;
    ELSIF NEW.event_type = 'click' THEN
      UPDATE public.sequence_step_executions
      SET clicked_at = COALESCE(clicked_at, NEW.created_at)
      WHERE tracking_id = NEW.tracking_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update sequence executions on tracking events
DROP TRIGGER IF EXISTS update_sequence_on_tracking_event ON public.tracking_events;
CREATE TRIGGER update_sequence_on_tracking_event
  AFTER INSERT ON public.tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sequence_on_email_event();