-- Add separate volume preferences for warning and critical alerts
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS warning_volume REAL DEFAULT 0.4,
ADD COLUMN IF NOT EXISTS critical_volume REAL DEFAULT 0.7;