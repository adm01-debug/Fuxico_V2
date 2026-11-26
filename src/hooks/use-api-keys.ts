// =============================================================================
// FUXICO - API Keys Hook
// Chaves de acesso usadas pelo webhook publico (zapier-webhook)
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const API_KEY_COLUMNS = 'id, name, key, is_active, last_used_at, created_at';

export const API_KEYS_QUERY_KEY = ['api-keys'] as const;

export interface ApiKey {
  id: string;
  name: string | null;
  key: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const token = btoa(binary).split('+').join('-').split('/').join('_').split('=').join('');
  return `fux_${token}`;
}

export function maskApiKey(key: string): string {
  if (key.length <= 16) return '\u2022'.repeat(key.length);
  return `${key.slice(0, 8)}\u2026${key.slice(-4)}`;
}

export function zapierWebhookUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL ?? '';
  return `${base}/functions/v1/zapier-webhook`;
}

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: API_KEYS_QUERY_KEY,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('api_keys')
        .select(API_KEY_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as ApiKey[];
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: input.name.trim() || null,
          key: generateApiKey(),
          is_active: true,
        })
        .select(API_KEY_COLUMNS)
        .single();

      if (error) throw error;
      return data as ApiKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useSetApiKeyActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('api_keys')
        .update({ is_active: input.isActive })
        .eq('id', input.id)
        .select(API_KEY_COLUMNS)
        .single();

      if (error) throw error;
      return data as ApiKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useTestApiKey() {
  return useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(zapierWebhookUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
        },
        body: JSON.stringify({ event: 'teste_fuxico', data: { origem: 'painel' } }),
      });

      return { success: response.ok, status: response.status };
    },
  });
}
