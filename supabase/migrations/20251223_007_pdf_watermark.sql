-- Migration: PDF Watermark
-- Feature 7/27: Confidential watermarks on PDFs

CREATE TABLE IF NOT EXISTS public.watermarked_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_document_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  watermark_settings JSONB NOT NULL,
  watermarked_url TEXT NOT NULL,
  original_url TEXT,
  views_count INTEGER DEFAULT 0,
  revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watermarked_docs_user ON public.watermarked_documents(user_id);
CREATE INDEX idx_watermarked_docs_recipient ON public.watermarked_documents(recipient_email);
CREATE INDEX idx_watermarked_docs_original ON public.watermarked_documents(original_document_id);

ALTER TABLE public.watermarked_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watermarked docs" ON public.watermarked_documents FOR ALL USING (auth.uid() = user_id);
