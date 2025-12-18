-- Create table for audit configuration
CREATE TABLE public.audit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  internal_domains text[] NOT NULL DEFAULT ARRAY['company.com']::text[],
  business_hours_start integer NOT NULL DEFAULT 8,
  business_hours_end integer NOT NULL DEFAULT 18,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  volume_threshold_hourly integer NOT NULL DEFAULT 50,
  volume_threshold_daily integer NOT NULL DEFAULT 200
);

-- Enable RLS
ALTER TABLE public.audit_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage config
CREATE POLICY "Admins can view config"
ON public.audit_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update config"
ON public.audit_config
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert config"
ON public.audit_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default config
INSERT INTO public.audit_config (internal_domains, business_hours_start, business_hours_end, timezone, volume_threshold_hourly, volume_threshold_daily)
VALUES (ARRAY['company.com', 'empresa.com.br']::text[], 8, 18, 'America/Sao_Paulo', 50, 200);

-- Add trigger for updated_at
CREATE TRIGGER update_audit_config_updated_at
BEFORE UPDATE ON public.audit_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();