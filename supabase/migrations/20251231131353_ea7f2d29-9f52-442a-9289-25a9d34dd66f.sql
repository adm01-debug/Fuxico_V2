-- Create password reset requests table with approval workflow
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all requests
CREATE POLICY "Admins can manage password reset requests"
  ON public.password_reset_requests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can insert a request (for unauthenticated users requesting reset)
CREATE POLICY "Anyone can request password reset"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests(status);
CREATE INDEX idx_password_reset_requests_email ON public.password_reset_requests(email);