
-- Harden rate_limit_logs parent: block all client inserts
DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "block_client_insert" ON public.rate_limit_logs
  FOR INSERT WITH CHECK (false);

-- Harden password_reset_requests: enforce user_id = auth.uid() on insert
DROP POLICY IF EXISTS "Validated password reset requests only" ON public.password_reset_requests;
CREATE POLICY "Users can create their own reset requests" ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND email IS NOT NULL
    AND email <> ''
    AND status = 'pending'
  );
