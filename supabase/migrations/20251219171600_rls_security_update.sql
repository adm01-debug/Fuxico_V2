-- Migration: Ajustar políticas RLS para maior segurança
-- Versão: 1.1.0
-- Data: 2025-12-19
--
-- PROBLEMA: Políticas RLS permitiam INSERT público em tracked_emails e tracking_events
-- SOLUÇÃO: Restringir INSERT apenas para usuários autenticados (tracked_emails) e 
--          manter público apenas para tracking_events (pixel precisa funcionar sem auth)

-- ============================================
-- TRACKED_EMAILS - Apenas usuários autenticados podem inserir
-- ============================================

-- Remover política antiga de INSERT público
DROP POLICY IF EXISTS "Allow public insert on tracked_emails" ON public.tracked_emails;

-- Nova política: Apenas usuários autenticados podem inserir seus próprios emails
CREATE POLICY "Authenticated users can insert their own tracked_emails"
ON public.tracked_emails
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política de SELECT: Usuários só veem seus próprios emails
DROP POLICY IF EXISTS "Allow public select on tracked_emails" ON public.tracked_emails;

CREATE POLICY "Users can view their own tracked_emails"
ON public.tracked_emails
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que Edge Functions (service_role) possam ler qualquer email para validação
-- Isso é necessário para track-pixel verificar se o tracking_id existe
CREATE POLICY "Service role can read all tracked_emails"
ON public.tracked_emails
FOR SELECT
TO service_role
USING (true);

-- ============================================
-- TRACKING_EVENTS - Manter INSERT público (pixel precisa funcionar)
-- ============================================

-- A política de INSERT para tracking_events DEVE permanecer pública
-- porque o pixel de rastreamento é carregado pelo cliente de email
-- do destinatário, que não tem autenticação

-- Verificar se já existe, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tracking_events' 
        AND policyname = 'Allow public insert on tracking_events'
    ) THEN
        CREATE POLICY "Allow public insert on tracking_events"
        ON public.tracking_events
        FOR INSERT
        WITH CHECK (true);
    END IF;
END
$$;

-- SELECT: Usuários só veem eventos dos seus próprios emails
DROP POLICY IF EXISTS "Allow public select on tracking_events" ON public.tracking_events;

CREATE POLICY "Users can view events of their own emails"
ON public.tracking_events
FOR SELECT
TO authenticated
USING (
    tracking_id IN (
        SELECT tracking_id FROM public.tracked_emails 
        WHERE user_id = auth.uid()
    )
);

-- Service role pode ver todos os eventos (para Edge Functions)
CREATE POLICY "Service role can read all tracking_events"
ON public.tracking_events
FOR SELECT
TO service_role
USING (true);

-- ============================================
-- TRACKED_LINKS - Ajustar políticas
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow public insert on tracked_links" ON public.tracked_links;
DROP POLICY IF EXISTS "Allow public select on tracked_links" ON public.tracked_links;
DROP POLICY IF EXISTS "Allow public update on tracked_links" ON public.tracked_links;

-- INSERT: Apenas via Edge Functions ou usuários autenticados
CREATE POLICY "Authenticated users can insert tracked_links"
ON public.tracked_links
FOR INSERT
TO authenticated
WITH CHECK (
    tracking_id IN (
        SELECT tracking_id FROM public.tracked_emails 
        WHERE user_id = auth.uid()
    )
);

-- SELECT: Usuários veem seus próprios links
CREATE POLICY "Users can view their own tracked_links"
ON public.tracked_links
FOR SELECT
TO authenticated
USING (
    tracking_id IN (
        SELECT tracking_id FROM public.tracked_emails 
        WHERE user_id = auth.uid()
    )
);

-- UPDATE: Público (necessário para incrementar click_count via track-link)
CREATE POLICY "Allow public update on tracked_links for click count"
ON public.tracked_links
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Service role pode fazer tudo
CREATE POLICY "Service role full access on tracked_links"
ON public.tracked_links
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- TRACKED_DOCUMENTS - Ajustar políticas (se existir)
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracked_documents') THEN
        -- Remover políticas antigas
        DROP POLICY IF EXISTS "Allow public insert on tracked_documents" ON public.tracked_documents;
        DROP POLICY IF EXISTS "Allow public select on tracked_documents" ON public.tracked_documents;
        
        -- INSERT: Apenas usuários autenticados
        CREATE POLICY "Authenticated users can insert tracked_documents"
        ON public.tracked_documents
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
        
        -- SELECT: Usuários veem seus próprios documentos
        CREATE POLICY "Users can view their own tracked_documents"
        ON public.tracked_documents
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON POLICY "Authenticated users can insert their own tracked_emails" ON public.tracked_emails IS 
'Usuários autenticados só podem criar trackings onde user_id = seu próprio ID. Edge Functions usam service_role para bypass.';

COMMENT ON POLICY "Users can view their own tracked_emails" ON public.tracked_emails IS 
'Usuários só podem ver emails que eles mesmos criaram.';

COMMENT ON POLICY "Users can view events of their own emails" ON public.tracking_events IS 
'Usuários só podem ver eventos de emails que pertencem a eles.';
