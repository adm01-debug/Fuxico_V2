import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface WhitelabelConfig {
  id: string;
  user_id: string;
  custom_domain: string | null;
  tracking_brand: string;
  hide_branding: boolean;
  custom_pixel_path: string;
  custom_link_path: string;
  created_at: string;
  updated_at: string;
}

export function useWhitelabel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['whitelabel-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('whitelabel_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as WhitelabelConfig | null;
    },
    enabled: !!user?.id,
  });

  const saveConfig = useMutation({
    mutationFn: async (data: Partial<Omit<WhitelabelConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('whitelabel_config')
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelabel-config'] });
      toast.success('Configuração white-label salva!');
    },
    onError: (error) => toast.error('Erro ao salvar', { description: error.message }),
  });

  return { config, isLoading, saveConfig };
}
