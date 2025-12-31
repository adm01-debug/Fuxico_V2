import { log } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ScheduledEmail {
  id: string;
  user_id: string;
  recipient_email: string;
  sender_email: string | null;
  subject: string;
  body: string | null;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  tracking_id: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledEmail {
  recipient_email: string;
  sender_email?: string;
  subject: string;
  body?: string;
  scheduled_at: string;
  metadata?: Json;
}

export function useScheduledEmails() {
  const { user } = useAuth();

  return useQuery<ScheduledEmail[]>({
    queryKey: ['scheduled-emails', user?.id],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as ScheduledEmail[];
    },
    enabled: !!user,
  });
}

export function useCreateScheduledEmail() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: CreateScheduledEmail) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: user.id,
          ...email,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-emails'] });
      toast.success('Email agendado com sucesso!');
    },
    onError: (error) => {
      log.error('Error scheduling email:', error);
      toast.error('Erro ao agendar email');
    },
  });
}

export function useUpdateScheduledEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: {
        recipient_email?: string;
        sender_email?: string;
        subject?: string;
        body?: string;
        scheduled_at?: string;
        sent_at?: string;
        status?: string;
        tracking_id?: string;
        metadata?: Json;
      }
    }) => {
      const { data, error } = await supabase
        .from('scheduled_emails')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-emails'] });
      toast.success('Email atualizado!');
    },
    onError: (error) => {
      log.error('Error updating scheduled email:', error);
      toast.error('Erro ao atualizar email');
    },
  });
}

export function useCancelScheduledEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_emails')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-emails'] });
      toast.success('Agendamento cancelado');
    },
    onError: (error) => {
      log.error('Error cancelling scheduled email:', error);
      toast.error('Erro ao cancelar agendamento');
    },
  });
}

export function useDeleteScheduledEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-emails'] });
      toast.success('Email excluído');
    },
    onError: (error) => {
      log.error('Error deleting scheduled email:', error);
      toast.error('Erro ao excluir email');
    },
  });
}
