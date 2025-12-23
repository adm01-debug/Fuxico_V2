-- Enable realtime for bounce_alerts table
ALTER TABLE public.bounce_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounce_alerts;