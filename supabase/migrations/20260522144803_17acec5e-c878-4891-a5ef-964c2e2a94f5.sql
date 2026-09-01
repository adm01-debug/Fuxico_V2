-- 1. Fix Security Linter Issues (search_path and SECURITY DEFINER)
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN 
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as func_name, pg_get_function_identity_arguments(p.oid) as func_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        -- Set search_path to public
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', func_record.schema_name, func_record.func_name, func_record.func_args);
        
        -- Revoke public execute for sensitive functions
        IF func_record.func_name IN ('reset_login_lockout', 'log_security_event', 'manage_email_verification_token', 'cleanup_expired_challenges') THEN
            EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', func_record.schema_name, func_record.func_name, func_record.func_args);
        END IF;
    END LOOP;
END $$;

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Audit Logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Stricter RLS for Tracking Tables
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tracking events" ON public.tracking_events;
CREATE POLICY "Users can view their own tracking events"
    ON public.tracking_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tracked_emails 
            WHERE tracked_emails.tracking_id = tracking_events.tracking_id 
            AND tracked_emails.user_id = auth.uid()
        )
    );

-- 4. Audit Helper Function
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, event_type, severity, description, metadata)
    VALUES (p_user_id, p_event_type, p_severity, p_description, p_metadata)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;
