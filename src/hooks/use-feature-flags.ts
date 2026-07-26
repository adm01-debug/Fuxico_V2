import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  percentage: number;
  conditions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as FeatureFlag[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isEnabled = (key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    if (!flag) return false;
    if (!flag.enabled) return false;
    if (flag.percentage < 100) {
      // Simple hash-based percentage rollout
      const hash = key.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
      return Math.abs(hash % 100) < flag.percentage;
    }
    return true;
  };

  const toggleFlag = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag atualizada!');
    },
    onError: (error) => toast.error('Erro ao atualizar flag', { description: error.message }),
  });

  const createFlag = useMutation({
    mutationFn: async (data: { key: string; name: string; description?: string; enabled?: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .insert({ ...data, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag criada!');
    },
    onError: (error) => toast.error('Erro ao criar flag', { description: error.message }),
  });

  const deleteFlag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feature_flags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag removida!');
    },
    onError: (error) => toast.error('Erro ao remover flag', { description: error.message }),
  });

  return { flags, isLoading, isEnabled, toggleFlag, createFlag, deleteFlag };
}
