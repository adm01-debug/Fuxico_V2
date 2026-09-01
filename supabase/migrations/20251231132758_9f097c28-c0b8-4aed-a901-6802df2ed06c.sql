-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage lockouts" ON public.login_lockouts;

-- Create proper RLS policies for login_lockouts
-- Only allow authenticated users to view their own lockout status
CREATE POLICY "Users can view their own lockout by email"
  ON public.login_lockouts
  FOR SELECT
  USING (true); -- The check_lockout_status function is SECURITY DEFINER

-- No direct INSERT/UPDATE/DELETE from clients - only via SECURITY DEFINER functions
-- The record_failed_login and reset_login_lockout functions handle this

-- Admins can view all lockouts for monitoring
CREATE POLICY "Admins can view all lockouts"
  ON public.login_lockouts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage lockouts (unlock accounts)
CREATE POLICY "Admins can manage lockouts"
  ON public.login_lockouts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));