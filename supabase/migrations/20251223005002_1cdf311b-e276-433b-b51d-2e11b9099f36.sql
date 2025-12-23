-- Create bounce_alerts table
CREATE TABLE public.bounce_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  bounce_rate NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'high_bounce_rate',
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create alert_thresholds table for configurable limits
CREATE TABLE public.alert_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bounce_rate_warning NUMERIC DEFAULT 5.0,
  bounce_rate_critical NUMERIC DEFAULT 10.0,
  low_delivery_rate NUMERIC DEFAULT 90.0,
  low_open_rate NUMERIC DEFAULT 10.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bounce_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS policies for bounce_alerts
CREATE POLICY "Users can view their own bounce alerts"
  ON public.bounce_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bounce alerts"
  ON public.bounce_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert bounce alerts"
  ON public.bounce_alerts FOR INSERT
  WITH CHECK (true);

-- RLS policies for alert_thresholds
CREATE POLICY "Users can view their own thresholds"
  ON public.alert_thresholds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thresholds"
  ON public.alert_thresholds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thresholds"
  ON public.alert_thresholds FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to check and create bounce alerts
CREATE OR REPLACE FUNCTION public.check_bounce_alerts(p_user_id UUID)
RETURNS TABLE(
  domain TEXT,
  bounce_rate NUMERIC,
  threshold NUMERIC,
  severity TEXT
) AS $$
DECLARE
  v_warning_threshold NUMERIC := 5.0;
  v_critical_threshold NUMERIC := 10.0;
BEGIN
  -- Get user thresholds
  SELECT at.bounce_rate_warning, at.bounce_rate_critical
  INTO v_warning_threshold, v_critical_threshold
  FROM alert_thresholds at
  WHERE at.user_id = p_user_id;

  -- Return domains exceeding thresholds
  RETURN QUERY
  SELECT 
    dr.domain,
    dr.bounce_rate,
    CASE 
      WHEN dr.bounce_rate >= v_critical_threshold THEN v_critical_threshold
      ELSE v_warning_threshold
    END as threshold,
    CASE 
      WHEN dr.bounce_rate >= v_critical_threshold THEN 'critical'
      ELSE 'warning'
    END as severity
  FROM domain_reputation dr
  WHERE dr.user_id = p_user_id
    AND dr.bounce_rate >= v_warning_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;