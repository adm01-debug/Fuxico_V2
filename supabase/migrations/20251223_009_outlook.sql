-- Feature 9/27: Outlook Add-in Support
CREATE TABLE IF NOT EXISTS public.outlook_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_connected BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{"auto_track": true, "invisible_tracker": false, "notifications": true}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outlook_connections_user ON public.outlook_connections(user_id);
ALTER TABLE public.outlook_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own outlook" ON public.outlook_connections FOR ALL USING (auth.uid() = user_id);
