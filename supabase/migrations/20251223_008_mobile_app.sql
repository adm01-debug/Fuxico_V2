-- Feature 8/27: Mobile App Support
CREATE TABLE IF NOT EXISTS public.mobile_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android')),
  push_token TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_name)
);

CREATE TABLE IF NOT EXISTS public.mobile_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mobile_devices_user ON public.mobile_devices(user_id);
CREATE INDEX idx_mobile_notifications_user ON public.mobile_notifications(user_id);
ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own devices" ON public.mobile_devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notifications" ON public.mobile_notifications FOR ALL USING (auth.uid() = user_id);
