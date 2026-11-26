import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

/**
 * Códigos de backup de MFA ficam hasheados (bcrypt) em `public.mfa_backup_codes`.
 * A geração e o consumo passam pelas RPCs SECURITY DEFINER
 * `generate_mfa_backup_codes` / `consume_mfa_backup_code` — nunca pelo cliente.
 */
export const mfaBackupCodesQueryKey = (userId?: string) => ['mfa-backup-codes', userId ?? 'anon'];

export function useMfaBackupCodes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const remainingQuery = useQuery({
    queryKey: mfaBackupCodesQueryKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mfa_backup_codes')
        .select('id')
        .eq('user_id', userId ?? '')
        .is('used_at', null);
      if (error) throw error;
      return data?.length ?? 0;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: mfaBackupCodesQueryKey(userId) });

  const generate = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase.rpc('generate_mfa_backup_codes');
      if (error) throw error;
      return (data ?? []) as string[];
    },
    onSuccess: invalidate,
  });

  const consume = useMutation({
    mutationFn: async (code: string) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const normalized = code.trim().toUpperCase();
      const { data, error } = await supabase.rpc('consume_mfa_backup_code', {
        _user_id: userId,
        _code: normalized,
      });
      if (error) throw error;
      return data === true;
    },
    onSuccess: invalidate,
  });

  return {
    remaining: remainingQuery.data ?? 0,
    isLoadingRemaining: remainingQuery.isLoading,
    generate,
    consume,
  };
}
