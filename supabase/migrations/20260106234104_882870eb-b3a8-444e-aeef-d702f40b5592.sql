-- =====================================================
-- REVISÃO DE SEGURANÇA RLS - Parte 2: Políticas restantes
-- =====================================================

-- As seguintes políticas com `true` são INTENCIONAIS e NECESSÁRIAS:
-- 1. document_events INSERT - Tracking público de documentos (sem auth)
-- 2. link_click_events INSERT - Tracking público de cliques (sem auth)
-- 3. login_attempts INSERT - Registro de tentativas de login (antes da auth)
-- 4. password_reset_requests INSERT - Solicitação de reset (sem auth)
-- 5. rate_limit_logs INSERT - Logs de rate limiting (sistema)
-- 6. security_events INSERT - Logs de segurança (sistema)
-- 7. unsubscribed_emails INSERT (source='link') - Descadastro público

-- No entanto, podemos adicionar validações extras para algumas:

-- 1. rate_limit_logs - Adicionar restrição de IP não vazio
DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "System can insert rate limit logs" 
ON public.rate_limit_logs 
FOR INSERT
WITH CHECK (ip_address IS NOT NULL AND ip_address != '' AND endpoint IS NOT NULL);

-- 2. security_events - Adicionar validação de campos obrigatórios
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT
WITH CHECK (event_type IS NOT NULL AND description IS NOT NULL);

-- 3. login_attempts - Adicionar validação
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE POLICY "System can insert login attempts" 
ON public.login_attempts 
FOR INSERT
WITH CHECK (email IS NOT NULL AND ip_address IS NOT NULL);

-- 4. password_reset_requests - Adicionar rate limiting via trigger
-- Já tem validação implícita pelo email e user_id, mantém como está

-- 5. document_events / link_click_events - Tracking público necessário
-- Estes são intencionais para permitir tracking sem autenticação

-- NOTA: As políticas de INSERT público para tracking são necessárias
-- porque os eventos de abertura/clique vêm de emails/links externos
-- onde o usuário não está autenticado no sistema.

-- Criar índices para melhorar performance de consultas de segurança
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created 
ON public.login_attempts(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created 
ON public.security_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_window 
ON public.rate_limit_logs(ip_address, window_start, window_end);

CREATE INDEX IF NOT EXISTS idx_login_lockouts_email 
ON public.login_lockouts(email);

-- Adicionar comentários nas tabelas explicando políticas de segurança
COMMENT ON TABLE public.document_events IS 'Eventos de visualização de documentos. INSERT público permitido para tracking sem autenticação.';
COMMENT ON TABLE public.link_click_events IS 'Eventos de cliques em links. INSERT público permitido para tracking sem autenticação.';
COMMENT ON TABLE public.login_attempts IS 'Registro de tentativas de login. INSERT público necessário para registrar antes da autenticação.';
COMMENT ON TABLE public.security_events IS 'Eventos de segurança do sistema. INSERT público para logging de sistema.';
COMMENT ON TABLE public.rate_limit_logs IS 'Logs de rate limiting. INSERT público para logging de sistema.';