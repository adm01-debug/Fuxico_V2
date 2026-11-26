/**
 * Conexao do Gmail corporativo (OAuth pela edge `gmail-auth`).
 *
 * A config vive em `gmail_configurations`; a policy "Users can manage their own Gmail
 * configs" (auth.uid() = user_id) permite ler e apagar a propria linha, entao a tela
 * consegue mostrar o status e desconectar sem depender de outra edge.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GmailConfiguration {
  id: string;
  email: string;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const GMAIL_CONFIGURATION_QUERY_KEY = ['gmail-configuration'];

export function buildGmailConnectUrl(userId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/gmail-auth?userId=${encodeURIComponent(userId)}`;
}

export function useGmailConfiguration() {
  return useQuery<GmailConfiguration | null>({
    queryKey: GMAIL_CONFIGURATION_QUERY_KEY,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('gmail_configurations')
        .select('id, email, is_active, expires_at, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Usuario nao autenticado');

      const { error } = await supabase.from('gmail_configurations').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GMAIL_CONFIGURATION_QUERY_KEY });
    },
  });
}
