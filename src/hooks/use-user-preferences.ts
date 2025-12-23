import { log } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  id: string;
  user_id: string;
  sound_enabled: boolean;
  desktop_enabled: boolean;
  email_enabled: boolean;
  notify_on_open: boolean;
  notify_on_click: boolean;
  notify_on_document_view: boolean;
  notify_on_document_download: boolean;
  email_digest_frequency: string;
  auto_reminder_enabled: boolean;
  auto_reminder_days: number;
  notification_sound_type: string;
  notification_volume: number;
  warning_volume: number;
  critical_volume: number;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  sound_enabled: true,
  desktop_enabled: true,
  email_enabled: false,
  notify_on_open: true,
  notify_on_click: true,
  notify_on_document_view: true,
  notify_on_document_download: true,
  email_digest_frequency: 'daily',
  auto_reminder_enabled: false,
  auto_reminder_days: 3,
  notification_sound_type: 'gentle',
  notification_volume: 0.5,
  warning_volume: 0.4,
  critical_volume: 0.7,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, ...defaultPreferences })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPrefs as UserPreferences;
      }

      return data as UserPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas preferências.',
        variant: 'destructive',
      });
      log.error('Error updating preferences:', error);
    },
  });

  return {
    preferences: preferences ?? null,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
