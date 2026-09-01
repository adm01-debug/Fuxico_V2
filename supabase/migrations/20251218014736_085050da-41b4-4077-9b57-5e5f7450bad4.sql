-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create email_audit_logs table for comprehensive tracking
CREATE TABLE public.email_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  recipient_email TEXT,
  sender_email TEXT,
  subject TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_external BOOLEAN DEFAULT false,
  external_domain TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins see all, users see their own
CREATE POLICY "Admins can view all audit logs"
ON public.email_audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own logs"
ON public.email_audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own logs"
ON public.email_audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create fraud_alerts table
CREATE TABLE public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('suspicious_hours', 'external_recipient', 'volume_anomaly')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  email_audit_log_id UUID REFERENCES public.email_audit_logs(id) ON DELETE SET NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can view and manage alerts
CREATE POLICY "Admins can view all alerts"
ON public.fraud_alerts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage alerts"
ON public.fraud_alerts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_email_audit_logs_user_id ON public.email_audit_logs(user_id);
CREATE INDEX idx_email_audit_logs_timestamp ON public.email_audit_logs(timestamp);
CREATE INDEX idx_email_audit_logs_direction ON public.email_audit_logs(direction);
CREATE INDEX idx_fraud_alerts_user_id ON public.fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_is_resolved ON public.fraud_alerts(is_resolved);
CREATE INDEX idx_fraud_alerts_alert_type ON public.fraud_alerts(alert_type);