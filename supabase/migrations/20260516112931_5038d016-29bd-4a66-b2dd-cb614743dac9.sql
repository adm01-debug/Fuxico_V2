-- Create whatsapp_configs table
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT false,
    phone_number TEXT,
    api_key TEXT,
    auto_follow_up BOOLEAN DEFAULT true,
    follow_up_delay INTEGER DEFAULT 24,
    follow_up_message TEXT DEFAULT 'Olá! Vi que você ainda não abriu o email que enviei sobre {{assunto}}. Posso ajudar?',
    max_retries INTEGER DEFAULT 2,
    business_hours_only BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own whatsapp config"
    ON public.whatsapp_configs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp config"
    ON public.whatsapp_configs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp config"
    ON public.whatsapp_configs FOR UPDATE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_whatsapp_configs_updated_at
    BEFORE UPDATE ON public.whatsapp_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();