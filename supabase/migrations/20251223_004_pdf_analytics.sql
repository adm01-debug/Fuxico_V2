-- Migration: PDF Analytics Avançado
-- Feature 4/27: Time spent per page, completion percentage

CREATE TABLE IF NOT EXISTS public.pdf_view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.tracked_documents(id) ON DELETE CASCADE,
  viewer_email TEXT,
  viewer_ip TEXT,
  total_pages INTEGER NOT NULL DEFAULT 1,
  pages_viewed INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  user_agent TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.pdf_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.tracked_documents(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.pdf_view_sessions(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  time_spent_ms INTEGER DEFAULT 0,
  scroll_depth NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pdf_view_sessions_doc ON public.pdf_view_sessions(document_id);
CREATE INDEX idx_pdf_view_sessions_email ON public.pdf_view_sessions(viewer_email);
CREATE INDEX idx_pdf_page_views_session ON public.pdf_page_views(session_id);
CREATE INDEX idx_pdf_page_views_doc_page ON public.pdf_page_views(document_id, page_number);

ALTER TABLE public.pdf_view_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own doc sessions" ON public.pdf_view_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tracked_documents WHERE id = document_id AND user_id = auth.uid())
);
CREATE POLICY "Anyone can insert sessions" ON public.pdf_view_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own page views" ON public.pdf_page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tracked_documents td WHERE td.id = document_id AND td.user_id = auth.uid())
);
CREATE POLICY "Anyone can insert page views" ON public.pdf_page_views FOR INSERT WITH CHECK (true);
