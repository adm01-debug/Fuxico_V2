import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/logger';

export interface WhatsAppConfig {
  id?: string;
  user_id?: string;
  enabled: boolean;
  phone_number: string;
  api_key: string;
  auto_follow_up: boolean;
  follow_up_delay: number;
  follow_up_message: string;
  max_retries: number;
  business_hours_only: boolean;
}

const defaultConfig: Omit<WhatsAppConfig, 'id' | 'user_id'> = {
  enabled: false,
  phone_number: '',
  api_key: '',
  auto_follow_up: true,
  follow_up_delay: 24,
  follow_up_message: 'Olá! Vi que você ainda não abriu o email que enviei sobre {{assunto}}. Posso ajudar?',
  max_retries: 2,
  business_hours_only: true,
};

export function useWhatsAppConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['whatsapp-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Return default if not exists, but don't insert yet to avoid unnecessary rows
        return { ...defaultConfig, user_id: user.id } as WhatsAppConfig;
      }

      return data as WhatsAppConfig;
    },
    enabled: !!user?.id,
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<WhatsAppConfig>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if record exists
      const { data: existing } = await supabase
        .from('whatsapp_configs')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('whatsapp_configs')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data as WhatsAppConfig;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_configs')
          .insert({ ...defaultConfig, ...updates, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data as WhatsAppConfig;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config', user?.id] });
      toast({
        title: 'Configurações salvas',
        description: 'Integração WhatsApp atualizada com sucesso.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações do WhatsApp.',
        variant: 'destructive',
      });
      log.error('Error updating whatsapp config:', err);
    },
  });

  return {
    config: config ?? null,
    isLoading,
    error,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}
