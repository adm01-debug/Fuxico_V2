CREATE TABLE IF NOT EXISTS public.internal_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.internal_config TO service_role;
REVOKE ALL ON public.internal_config FROM anon, authenticated, PUBLIC;

ALTER TABLE public.internal_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no public access" ON public.internal_config;
CREATE POLICY "no public access" ON public.internal_config FOR ALL USING (false) WITH CHECK (false);

INSERT INTO public.internal_config (key, value)
VALUES ('ab_dispatch_cron_token', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.internal_get_config(_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v text;
BEGIN
  SELECT value INTO v FROM public.internal_config WHERE key = _key;
  RETURN v;
END; $$;

REVOKE ALL ON FUNCTION public.internal_get_config(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.internal_get_config(text) TO service_role;