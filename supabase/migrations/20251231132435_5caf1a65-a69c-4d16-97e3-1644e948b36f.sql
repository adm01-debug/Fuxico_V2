-- Create login lockouts table for exponential backoff
CREATE TABLE IF NOT EXISTS public.login_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_until TIMESTAMP WITH TIME ZONE,
  last_failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on email for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_login_lockouts_email ON public.login_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_login_lockouts_ip ON public.login_lockouts(ip_address);

-- Enable RLS
ALTER TABLE public.login_lockouts ENABLE ROW LEVEL SECURITY;

-- Allow read/write for service role only (edge functions)
CREATE POLICY "Service role can manage lockouts"
  ON public.login_lockouts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check if email/IP is locked out
CREATE OR REPLACE FUNCTION public.check_lockout_status(_email TEXT, _ip_address TEXT DEFAULT NULL)
RETURNS TABLE(
  is_locked BOOLEAN,
  lockout_remaining_seconds INTEGER,
  failed_attempts INTEGER,
  lockout_until TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lockout RECORD;
BEGIN
  SELECT ll.failed_attempts, ll.lockout_until
  INTO v_lockout
  FROM login_lockouts ll
  WHERE ll.email = _email;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF v_lockout.lockout_until IS NOT NULL AND v_lockout.lockout_until > now() THEN
    RETURN QUERY SELECT 
      true,
      EXTRACT(EPOCH FROM (v_lockout.lockout_until - now()))::INTEGER,
      v_lockout.failed_attempts,
      v_lockout.lockout_until;
  ELSE
    RETURN QUERY SELECT 
      false,
      0,
      v_lockout.failed_attempts,
      v_lockout.lockout_until;
  END IF;
END;
$$;

-- Function to record failed login attempt with exponential backoff
CREATE OR REPLACE FUNCTION public.record_failed_login(_email TEXT, _ip_address TEXT DEFAULT NULL)
RETURNS TABLE(
  is_now_locked BOOLEAN,
  lockout_seconds INTEGER,
  total_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts INTEGER;
  v_lockout_seconds INTEGER;
  v_lockout_until TIMESTAMP WITH TIME ZONE;
  v_max_attempts INTEGER := 5;
BEGIN
  -- Upsert the lockout record
  INSERT INTO login_lockouts (email, ip_address, failed_attempts, last_failed_at)
  VALUES (_email, _ip_address, 1, now())
  ON CONFLICT (email) DO UPDATE SET
    failed_attempts = login_lockouts.failed_attempts + 1,
    last_failed_at = now(),
    ip_address = COALESCE(_ip_address, login_lockouts.ip_address),
    updated_at = now()
  RETURNING failed_attempts INTO v_attempts;
  
  -- Calculate exponential backoff if threshold reached
  IF v_attempts >= v_max_attempts THEN
    -- Exponential: 30s, 60s, 120s, 240s, 480s... (30 * 2^(attempts-5))
    v_lockout_seconds := 30 * POWER(2, LEAST(v_attempts - v_max_attempts, 10));
    v_lockout_until := now() + (v_lockout_seconds || ' seconds')::INTERVAL;
    
    UPDATE login_lockouts
    SET lockout_until = v_lockout_until
    WHERE email = _email;
    
    -- Log security event
    INSERT INTO security_events (event_type, severity, description, ip_address, metadata)
    VALUES (
      'account_lockout',
      'warning',
      'Account temporarily locked after ' || v_attempts || ' failed login attempts',
      _ip_address,
      jsonb_build_object('email', _email, 'attempts', v_attempts, 'lockout_seconds', v_lockout_seconds)
    );
    
    RETURN QUERY SELECT true, v_lockout_seconds, v_attempts;
  ELSE
    RETURN QUERY SELECT false, 0, v_attempts;
  END IF;
END;
$$;

-- Function to reset lockout on successful login
CREATE OR REPLACE FUNCTION public.reset_login_lockout(_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_lockouts WHERE email = _email;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_login_lockouts_updated_at
  BEFORE UPDATE ON public.login_lockouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();