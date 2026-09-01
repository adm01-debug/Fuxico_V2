-- Migration: Screen Recording
-- Feature 6/27: Video recording and tracking

CREATE TABLE IF NOT EXISTS public.screen_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_ms INTEGER DEFAULT 0,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recording_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.screen_recordings(id) ON DELETE CASCADE,
  viewer_email TEXT,
  viewer_ip TEXT,
  watch_time_ms INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screen_recordings_user ON public.screen_recordings(user_id);
CREATE INDEX idx_recording_views_recording ON public.recording_views(recording_id);

ALTER TABLE public.screen_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recording_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recordings" ON public.screen_recordings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public recordings" ON public.screen_recordings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert views" ON public.recording_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own recording views" ON public.recording_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.screen_recordings WHERE id = recording_id AND user_id = auth.uid())
);
