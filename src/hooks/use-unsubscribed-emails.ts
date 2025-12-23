import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UnsubscribedEmail {
  id: string;
  user_id: string;
  email: string;
  reason: string | null;
  unsubscribed_at: string;
  source: 'manual' | 'link' | 'bounce' | 'complaint';
  tracking_id: string | null;
  created_at: string;
}

export function useUnsubscribedEmails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unsubscribedEmails = [], isLoading, error } = useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['unsubscribed-emails', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('unsubscribed_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('unsubscribed_at', { ascending: false });
      
      if (error) throw error;
      return data as UnsubscribedEmail[];
    },
    enabled: !!user?.id,
  });

  const addUnsubscribe = useMutation({
    mutationFn: async ({ email, reason }: { email: string; reason?: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('unsubscribed_emails')
        .insert({
          user_id: user.id,
          email: email.toLowerCase().trim(),
          reason,
          source: 'manual',
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este email já está na lista de descadastrados');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unsubscribed-emails'] });
      toast.success('Email adicionado à lista de exclusão');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar email', { description: error.message });
    },
  });

  const removeUnsubscribe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unsubscribed_emails')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unsubscribed-emails'] });
      toast.success('Email removido da lista de exclusão');
    },
    onError: (error) => {
      toast.error('Erro ao remover email', { description: error.message });
    },
  });

  const bulkAddUnsubscribe = useMutation({
    mutationFn: async (emails: string[]) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const inserts = emails.map(email => ({
        user_id: user.id,
        email: email.toLowerCase().trim(),
        source: 'manual' as const,
      }));
      
      const { error } = await supabase
        .from('unsubscribed_emails')
        .upsert(inserts, { onConflict: 'user_id,email', ignoreDuplicates: true });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unsubscribed-emails'] });
      toast.success('Emails adicionados à lista de exclusão');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar emails', { description: error.message });
    },
  });

  const isUnsubscribed = (email: string): boolean => {
    return unsubscribedEmails.some(u => u.email.toLowerCase() === email.toLowerCase());
  };

  return {
    unsubscribedEmails,
    isLoading,
    error,
    addUnsubscribe,
    removeUnsubscribe,
    bulkAddUnsubscribe,
    isUnsubscribed,
  };
}

