-- Add notification sound type preference
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS notification_sound_type TEXT DEFAULT 'gentle';