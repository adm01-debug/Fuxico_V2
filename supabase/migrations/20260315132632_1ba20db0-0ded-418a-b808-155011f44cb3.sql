-- Feature Flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  percentage integer DEFAULT 100,
  conditions jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feature flags"
  ON public.feature_flags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- White-label config table
CREATE TABLE IF NOT EXISTS public.whitelabel_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  custom_domain text,
  tracking_brand text DEFAULT '',
  hide_branding boolean DEFAULT false,
  custom_pixel_path text DEFAULT '/px',
  custom_link_path text DEFAULT '/l',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.whitelabel_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whitelabel config"
  ON public.whitelabel_config FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whitelabel config"
  ON public.whitelabel_config FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whitelabel config"
  ON public.whitelabel_config FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own whitelabel config"
  ON public.whitelabel_config FOR DELETE TO authenticated
  USING (auth.uid() = user_id);