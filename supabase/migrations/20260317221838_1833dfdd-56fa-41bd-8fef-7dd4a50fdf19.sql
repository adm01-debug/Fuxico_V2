
-- FIX 1: unsubscribed_emails - Validate tracking_id and email match
DROP POLICY IF EXISTS "Allow public unsubscribe via link" ON public.unsubscribed_emails;
CREATE POLICY "Allow public unsubscribe via link" ON public.unsubscribed_emails
FOR INSERT TO public
WITH CHECK (
  source = 'link'
  AND tracking_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tracked_emails te
    WHERE te.tracking_id = unsubscribed_emails.tracking_id
      AND te.recipient_email = unsubscribed_emails.email
  )
);

-- FIX 2: security_events - Require authentication
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
CREATE POLICY "Authenticated users can insert own security events" ON public.security_events
FOR INSERT TO authenticated
WITH CHECK (
  event_type IS NOT NULL
  AND description IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- FIX 3: login_attempts - Remove open public INSERT, use security definer
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  _email text,
  _ip_address text,
  _success boolean DEFAULT false,
  _user_agent text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO login_attempts (email, ip_address, success, user_agent, metadata)
  VALUES (_email, _ip_address, _success, _user_agent, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- FIX 4: password_reset_requests - Restrict INSERT
DROP POLICY IF EXISTS "Anyone can request password reset" ON public.password_reset_requests;
CREATE POLICY "Validated password reset requests only" ON public.password_reset_requests
FOR INSERT TO public
WITH CHECK (
  email IS NOT NULL
  AND email <> ''
  AND user_id IS NOT NULL
  AND status = 'pending'
);

-- FIX 5: geo_whitelist - Restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can view geo whitelist" ON public.geo_whitelist;
CREATE POLICY "Authenticated users can view geo whitelist" ON public.geo_whitelist
FOR SELECT TO authenticated
USING (true);

-- FIX 6: Revoke anon access to materialized view
REVOKE ALL ON public.email_stats_mv FROM anon;
GRANT SELECT ON public.email_stats_mv TO authenticated;
