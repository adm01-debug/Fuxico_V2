-- =============================================================================
-- FUXICO - Security Module Complete Database Schema
-- =============================================================================

-- 1. PERMISSIONS SYSTEM
-- Create permissions enum for granular control
CREATE TYPE public.permission_type AS ENUM (
  'read', 'write', 'delete', 'admin', 'manage_users', 'manage_roles',
  'view_analytics', 'export_data', 'manage_webhooks', 'manage_templates',
  'view_audit_logs', 'manage_security', 'manage_mfa', 'manage_rate_limits'
);

-- Permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permission_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Role permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(role, permission_id)
);

-- 2. MFA SETTINGS
CREATE TABLE public.mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  totp_secret TEXT,
  backup_codes TEXT[],
  last_verified_at TIMESTAMP WITH TIME ZONE,
  enrolled_at TIMESTAMP WITH TIME ZONE,
  recovery_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. RATE LIMIT LOGS
CREATE TABLE public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1 NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  user_id UUID,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. BLOCKED IPS
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_by UUID,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. IP WHITELIST
CREATE TABLE public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  description TEXT,
  added_by UUID,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. SECURITY EVENTS (Audit Trail)
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. PASSWORD RESET TOKENS
CREATE TABLE public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. EMAIL VERIFICATION TOKENS
CREATE TABLE public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. LOGIN ATTEMPTS (Brute Force Protection)
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  success BOOLEAN DEFAULT false NOT NULL,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 10. ACTIVE SESSIONS
CREATE TABLE public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_rate_limit_logs_ip ON public.rate_limit_logs(ip_address);
CREATE INDEX idx_rate_limit_logs_window ON public.rate_limit_logs(window_start, window_end);
CREATE INDEX idx_blocked_ips_ip ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ip_whitelist_ip ON public.ip_whitelist(ip_address);
CREATE INDEX idx_security_events_user ON public.security_events(user_id);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX idx_active_sessions_user ON public.active_sessions(user_id);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Permissions (read by all authenticated, manage by admin)
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Role Permissions
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- MFA Settings (users manage their own)
CREATE POLICY "Users can view their own MFA settings" ON public.mfa_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA settings" ON public.mfa_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings" ON public.mfa_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Rate Limit Logs (admin only)
CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert rate limit logs" ON public.rate_limit_logs
  FOR INSERT WITH CHECK (true);

-- Blocked IPs (admin only)
CREATE POLICY "Admins can view blocked IPs" ON public.blocked_ips
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- IP Whitelist (admin only)
CREATE POLICY "Admins can view IP whitelist" ON public.ip_whitelist
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage IP whitelist" ON public.ip_whitelist
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Security Events
CREATE POLICY "Users can view their own security events" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert security events" ON public.security_events
  FOR INSERT WITH CHECK (true);

-- Password Reset Tokens
CREATE POLICY "System can manage password reset tokens" ON public.password_reset_tokens
  FOR ALL WITH CHECK (true);

-- Email Verification Tokens
CREATE POLICY "System can manage email verification tokens" ON public.email_verification_tokens
  FOR ALL WITH CHECK (true);

-- Login Attempts
CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert login attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- Active Sessions
CREATE POLICY "Users can view their own sessions" ON public.active_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.active_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.active_sessions
  FOR ALL WITH CHECK (true);

-- SECURITY FUNCTIONS

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id
      AND p.permission_key = _permission_key
  )
$$;

-- Check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_ips
    WHERE ip_address = _ip_address
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Check if IP is whitelisted
CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ip_whitelist
    WHERE ip_address = _ip_address
      AND is_active = true
  )
$$;

-- Log security event
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id UUID,
  _event_type TEXT,
  _severity TEXT,
  _description TEXT,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id UUID;
BEGIN
  INSERT INTO public.security_events (user_id, event_type, severity, description, ip_address, user_agent, metadata)
  VALUES (_user_id, _event_type, _severity, _description, _ip_address, _user_agent, _metadata)
  RETURNING id INTO _event_id;
  
  RETURN _event_id;
END;
$$;

-- Get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE (permission_key TEXT, permission_name TEXT, category TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.permission_key, p.name, p.category
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role = rp.role
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = _user_id
  ORDER BY p.category, p.name
$$;

-- Check login attempts (brute force protection)
CREATE OR REPLACE FUNCTION public.check_login_attempts(_email TEXT, _ip_address TEXT, _window_minutes INTEGER DEFAULT 15, _max_attempts INTEGER DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < _max_attempts
  FROM public.login_attempts
  WHERE (email = _email OR ip_address = _ip_address)
    AND success = false
    AND created_at > (now() - (_window_minutes || ' minutes')::INTERVAL)
$$;

-- Insert default permissions
INSERT INTO public.permissions (name, permission_key, category, description) VALUES
  ('View Dashboard', 'view_dashboard', 'dashboard', 'Access to view the main dashboard'),
  ('View Analytics', 'view_analytics', 'analytics', 'Access to view analytics and reports'),
  ('Export Data', 'export_data', 'data', 'Ability to export data'),
  ('Manage Templates', 'manage_templates', 'templates', 'Create, edit, delete email templates'),
  ('Manage Campaigns', 'manage_campaigns', 'campaigns', 'Create, edit, delete campaigns'),
  ('Manage Webhooks', 'manage_webhooks', 'integrations', 'Configure webhook integrations'),
  ('View Audit Logs', 'view_audit_logs', 'security', 'Access to security audit logs'),
  ('Manage Users', 'manage_users', 'admin', 'Add, edit, remove users'),
  ('Manage Roles', 'manage_roles', 'admin', 'Configure roles and permissions'),
  ('Manage Security', 'manage_security', 'security', 'Configure security settings'),
  ('Manage MFA', 'manage_mfa', 'security', 'Configure MFA settings'),
  ('Manage Rate Limits', 'manage_rate_limits', 'security', 'Configure rate limiting'),
  ('View Tracking', 'view_tracking', 'tracking', 'View email tracking data'),
  ('Manage Documents', 'manage_documents', 'documents', 'Upload and manage tracked documents'),
  ('Full Access', 'full_access', 'admin', 'Complete system access');

-- Assign permissions to admin role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions;

-- Assign basic permissions to user role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'user', id FROM public.permissions 
WHERE permission_key IN ('view_dashboard', 'view_analytics', 'view_tracking', 'manage_templates', 'manage_campaigns', 'manage_documents');

-- Enable realtime for security events
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rate_limit_logs;