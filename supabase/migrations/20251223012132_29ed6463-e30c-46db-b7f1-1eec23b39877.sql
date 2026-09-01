-- Add notification volume preference
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS notification_volume REAL DEFAULT 0.5;