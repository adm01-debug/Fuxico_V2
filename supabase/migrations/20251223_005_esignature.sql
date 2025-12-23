-- Migration: eSignature com Audit Trail
-- Feature 5/27: Digital signatures with full audit trail

CREATE TABLE IF NOT EXISTS public.signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  signers JSONB NOT NULL DEFAULT '[]',
  fields JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed', 'cancelled', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.signature_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  data JSONB NOT NULL,
  signature_image TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signature_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'sent', 'viewed', 'signed', 'declined', 'completed', 'expired', 'cancelled')),
  actor_email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signed_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  original_document_url TEXT NOT NULL,
  signed_document_url TEXT NOT NULL,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signature_requests_sender ON public.signature_requests(sender_id);
CREATE INDEX idx_signature_requests_status ON public.signature_requests(status);
CREATE INDEX idx_signature_data_request ON public.signature_data(request_id);
CREATE INDEX idx_signature_audit_request ON public.signature_audit_trail(request_id);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own requests" ON public.signature_requests FOR ALL USING (auth.uid() = sender_id);
CREATE POLICY "Signers can view requests" ON public.signature_requests FOR SELECT USING (signers::text LIKE '%' || auth.jwt()->>'email' || '%');

CREATE POLICY "Users can view signature data" ON public.signature_data FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.signature_requests WHERE id = request_id AND sender_id = auth.uid())
);
CREATE POLICY "Signers can insert data" ON public.signature_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view audit trail" ON public.signature_audit_trail FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.signature_requests WHERE id = request_id AND sender_id = auth.uid())
);
CREATE POLICY "Anyone can insert audit" ON public.signature_audit_trail FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view signed docs" ON public.signed_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.signature_requests WHERE id = request_id AND sender_id = auth.uid())
);
