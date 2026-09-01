-- Create storage bucket for tracked documents
INSERT INTO storage.buckets (id, name, public) VALUES ('tracked-documents', 'tracked-documents', false);

-- Create tracked_documents table
CREATE TABLE public.tracked_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  recipient_name TEXT,
  recipient_email TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tracked_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for tracked_documents
CREATE POLICY "Users can view their own documents" 
ON public.tracked_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.tracked_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.tracked_documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.tracked_documents FOR DELETE 
USING (auth.uid() = user_id);

-- Create document_events table for tracking views
CREATE TABLE public.document_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.tracked_documents(document_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'download', 'page_view'
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  page_number INTEGER,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_events ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for tracking (like tracking pixels)
CREATE POLICY "Allow public insert on document_events" 
ON public.document_events FOR INSERT 
WITH CHECK (true);

-- Users can view events for their own documents
CREATE POLICY "Users can view their own document events" 
ON public.document_events FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tracked_documents 
  WHERE tracked_documents.document_id = document_events.document_id 
  AND tracked_documents.user_id = auth.uid()
));

-- Storage policies for tracked-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tracked-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents in storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'tracked-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'tracked-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for document_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_events;