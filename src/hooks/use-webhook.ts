// =============================================================================
// FUXICO - Webhook Configuration Hook
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WebhookConfig {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  event_type: string;
  success: boolean;
  response_status?: number;
  error?: string;
  created_at: string;
}

export function useWebhookConfig() {
  return useQuery<WebhookConfig | null>({
    queryKey: ['webhook-config'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return data as WebhookConfig | null;
    },
  });
}

export function useWebhookLogs(limit = 20) {
  return useQuery<WebhookLog[]>({
    queryKey: ['webhook-logs', limit],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('webhook_logs')
        .select('id, event_type, success, response_status, error, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      return (data || []) as WebhookLog[];
    },
  });
}

export function useSaveWebhookConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: { url: string; secret?: string; events: string[]; is_active: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('webhook_configs')
        .upsert({
          user_id: user.id,
          ...config,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-config'] });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          event: 'test',
          message: 'Test webhook from FUXICO',
          timestamp: new Date().toISOString(),
        }),
      });
      return { success: true };
    },
  });
}
