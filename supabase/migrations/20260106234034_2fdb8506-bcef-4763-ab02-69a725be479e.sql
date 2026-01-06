-- =====================================================
-- REVISÃO DE SEGURANÇA RLS - Correção de políticas permissivas
-- =====================================================

-- 1. active_sessions - Remover política ALL permissiva e criar políticas específicas
DROP POLICY IF EXISTS "System can manage sessions" ON public.active_sessions;

-- Apenas autenticados podem inserir suas próprias sessões
CREATE POLICY "Users can insert their own sessions" 
ON public.active_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias sessões
CREATE POLICY "Users can update their own sessions" 
ON public.active_sessions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- 2. email_verification_tokens - Restringir acesso
DROP POLICY IF EXISTS "System can manage email verification tokens" ON public.email_verification_tokens;

-- Criar função security definer para gerenciar tokens (usada por edge functions)
CREATE OR REPLACE FUNCTION public.manage_email_verification_token(
  _user_id uuid,
  _email text,
  _token text,
  _expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO email_verification_tokens (user_id, email, token, expires_at)
  VALUES (_user_id, _email, _token, _expires_at)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- Apenas o próprio usuário pode ver seus tokens
CREATE POLICY "Users can view their own verification tokens" 
ON public.email_verification_tokens 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- System/edge functions usam a função security definer, não precisa INSERT direto
-- Para verificação pública do token, criar função
CREATE OR REPLACE FUNCTION public.verify_email_token(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record RECORD;
BEGIN
  SELECT * INTO _record
  FROM email_verification_tokens
  WHERE token = _token
    AND expires_at > now()
    AND verified_at IS NULL;
    
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  UPDATE email_verification_tokens
  SET verified_at = now()
  WHERE id = _record.id;
  
  RETURN true;
END;
$$;

-- 3. password_reset_tokens - Restringir acesso
DROP POLICY IF EXISTS "System can manage password reset tokens" ON public.password_reset_tokens;

-- Criar função security definer para gerenciar tokens de reset
CREATE OR REPLACE FUNCTION public.create_password_reset_token(
  _user_id uuid,
  _token text,
  _expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO password_reset_tokens (user_id, token, expires_at)
  VALUES (_user_id, _token, _expires_at)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- Função para usar o token
CREATE OR REPLACE FUNCTION public.use_password_reset_token(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record RECORD;
BEGIN
  SELECT * INTO _record
  FROM password_reset_tokens
  WHERE token = _token
    AND expires_at > now()
    AND used_at IS NULL;
    
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  UPDATE password_reset_tokens
  SET used_at = now()
  WHERE id = _record.id;
  
  RETURN _record.user_id;
END;
$$;

-- Usuários autenticados podem ver seus próprios tokens (para debug/histórico)
CREATE POLICY "Users can view their own reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 4. webauthn_challenges - Restringir operações
DROP POLICY IF EXISTS "Allow challenge creation" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Allow challenge deletion" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Allow challenge lookup" ON public.webauthn_challenges;

-- Criar função security definer para gerenciar challenges
CREATE OR REPLACE FUNCTION public.create_webauthn_challenge(
  _user_id uuid,
  _email text,
  _challenge text,
  _type text,
  _expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO webauthn_challenges (user_id, email, challenge, type, expires_at)
  VALUES (_user_id, _email, _challenge, _type, _expires_at)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- Função para verificar e consumir challenge
CREATE OR REPLACE FUNCTION public.verify_webauthn_challenge(_challenge text)
RETURNS TABLE(user_id uuid, email text, type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM webauthn_challenges wc
  WHERE wc.challenge = _challenge
    AND wc.expires_at > now()
  RETURNING wc.user_id, wc.email, wc.type;
END;
$$;

-- Usuários autenticados podem ver seus próprios challenges
CREATE POLICY "Users can view their own challenges" 
ON public.webauthn_challenges 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 5. bounce_alerts - Restringir INSERT para sistema via função
DROP POLICY IF EXISTS "System can insert bounce alerts" ON public.bounce_alerts;

-- Criar função security definer
CREATE OR REPLACE FUNCTION public.create_bounce_alert(
  _user_id uuid,
  _domain text,
  _bounce_rate numeric,
  _threshold numeric,
  _alert_type text DEFAULT 'warning'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO bounce_alerts (user_id, domain, bounce_rate, threshold, alert_type)
  VALUES (_user_id, _domain, _bounce_rate, _threshold, _alert_type)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- Usuários podem inserir seus próprios alertas
CREATE POLICY "Users can insert their own bounce alerts" 
ON public.bounce_alerts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Adicionar política DELETE para bounce_alerts (faltando)
CREATE POLICY "Users can delete their own bounce alerts" 
ON public.bounce_alerts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 6. Garantir que login_lockouts só permite SELECT para admin (remover true)
DROP POLICY IF EXISTS "Users can view their own lockout by email" ON public.login_lockouts;

-- Função para verificar lockout (usada no login antes de autenticação)
CREATE OR REPLACE FUNCTION public.get_lockout_status(_email text)
RETURNS TABLE(
  is_locked boolean,
  lockout_until timestamptz,
  failed_attempts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ll.lockout_until IS NOT NULL AND ll.lockout_until > now(),
    ll.lockout_until,
    ll.failed_attempts
  FROM login_lockouts ll
  WHERE ll.email = _email;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::timestamptz, 0;
  END IF;
END;
$$;