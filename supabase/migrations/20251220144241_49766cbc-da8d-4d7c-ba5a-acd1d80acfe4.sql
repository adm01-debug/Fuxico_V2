-- Add auto-reminder settings to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN auto_reminder_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN auto_reminder_days integer NOT NULL DEFAULT 3;