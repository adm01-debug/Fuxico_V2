-- Create geo whitelist table for allowed countries
CREATE TABLE public.geo_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geo_whitelist ENABLE ROW LEVEL SECURITY;

-- Only admins can manage geo whitelist
CREATE POLICY "Admins can manage geo whitelist"
  ON public.geo_whitelist
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view geo whitelist (to check if their country is allowed)
CREATE POLICY "Authenticated users can view geo whitelist"
  ON public.geo_whitelist
  FOR SELECT
  USING (true);

-- Create function to check if country is allowed
CREATE OR REPLACE FUNCTION public.is_country_allowed(_country_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- If no countries in whitelist, allow all (feature disabled)
  SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.geo_whitelist WHERE is_active = true) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.geo_whitelist
      WHERE country_code = UPPER(_country_code)
        AND is_active = true
    )
  END
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_geo_whitelist_updated_at
  BEFORE UPDATE ON public.geo_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();