/**
 * Hook para gerenciamento de testes A/B em campanhas de email
 * 
 * @description Este hook fornece funcionalidades para hook para gerenciamento de testes a/b em campanhas de email.
 * Inclui gerenciamento de estado, cache e tratamento de erros.
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useabtests();
 * ```
 * 
 * @returns Object contendo data, isLoading, error e funções auxiliares
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SegmentFilters {
  min_score?: number;
  score_levels?: string[];
  last_open_days?: number;
}

export interface ABTest {
  id: string;
  user_id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variant_a_subject: string;
  variant_b_subject: string;
  variant_a_body: string | null;
  variant_b_body: string | null;
  variant_a_sends: number;
  variant_b_sends: number;
  variant_a_opens: number;
  variant_b_opens: number;
  variant_a_clicks: number;
  variant_b_clicks: number;
  winner: 'A' | 'B' | null;
  recipient_email: string | null;
  segment_filters: SegmentFilters;
  holdout_percent: number;
  auto_promote: boolean;
  min_sample_size: number;
  winner_promoted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateABTestData {
  name: string;
  variant_a_subject: string;
  variant_b_subject: string;
  variant_a_body?: string;
  variant_b_body?: string;
  recipient_email?: string;
  segment_filters?: SegmentFilters;
  holdout_percent?: number;
  auto_promote?: boolean;
  min_sample_size?: number;
}


export function useABTests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading, error } = useQuery({
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    queryKey: ['ab-tests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ABTest[];
    },
    enabled: !!user?.id,
  });

  const createTest = useMutation({
    mutationFn: async (testData: CreateABTestData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          user_id: user.id,
          name: testData.name,
          variant_a_subject: testData.variant_a_subject,
          variant_b_subject: testData.variant_b_subject,
          variant_a_body: testData.variant_a_body ?? null,
          variant_b_body: testData.variant_b_body ?? null,
          recipient_email: testData.recipient_email || null,
          segment_filters: (testData.segment_filters ?? {}) as never,
          holdout_percent: testData.holdout_percent ?? 10,
          auto_promote: testData.auto_promote ?? true,
          min_sample_size: testData.min_sample_size ?? 30,
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('Teste A/B criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar teste', { description: error.message });
    },
  });

  const startTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ab_tests')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('Teste iniciado!');
    },
    onError: (error) => {
      toast.error('Erro ao iniciar teste', { description: error.message });
    },
  });

  const pauseTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ab_tests')
        .update({ status: 'paused' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('Teste pausado!');
    },
    onError: (error) => {
      toast.error('Erro ao pausar teste', { description: error.message });
    },
  });

  const completeTest = useMutation({
    mutationFn: async ({ id, winner }: { id: string; winner: 'A' | 'B' }) => {
      const { error } = await supabase
        .from('ab_tests')
        .update({ 
          status: 'completed',
          winner,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('Teste finalizado!');
    },
    onError: (error) => {
      toast.error('Erro ao finalizar teste', { description: error.message });
    },
  });

  const updateMetrics = useMutation({
    mutationFn: async ({ 
      id, 
      variant, 
      sends = 0, 
      opens = 0, 
      clicks = 0 
    }: { 
      id: string; 
      variant: 'A' | 'B';
      sends?: number;
      opens?: number;
      clicks?: number;
    }) => {
      const test = tests.find(t => t.id === id);
      if (!test) throw new Error('Teste não encontrado');

      const updates = variant === 'A' 
        ? {
            variant_a_sends: test.variant_a_sends + sends,
            variant_a_opens: test.variant_a_opens + opens,
            variant_a_clicks: test.variant_a_clicks + clicks,
          }
        : {
            variant_b_sends: test.variant_b_sends + sends,
            variant_b_opens: test.variant_b_opens + opens,
            variant_b_clicks: test.variant_b_clicks + clicks,
          };

      const { error } = await supabase
        .from('ab_tests')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      // Check for auto-winner after metrics update
      checkAutoWinner();
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ab_tests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('Teste removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover teste', { description: error.message });
    },
  });

  // Auto-winner detection with statistical significance
  const checkAutoWinner = () => {
    const runningTests = tests.filter(t => t.status === 'running');
    for (const test of runningTests) {
      const minSends = 30; // Minimum sends per variant
      if (test.variant_a_sends < minSends || test.variant_b_sends < minSends) continue;

      const rateA = test.variant_a_opens / test.variant_a_sends;
      const rateB = test.variant_b_opens / test.variant_b_sends;
      const totalSends = test.variant_a_sends + test.variant_b_sends;

      // Simple Z-test for proportions
      const pooledRate = (test.variant_a_opens + test.variant_b_opens) / totalSends;
      const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / test.variant_a_sends + 1 / test.variant_b_sends));
      
      if (se === 0) continue;
      const zScore = Math.abs(rateA - rateB) / se;

      // 95% confidence = z > 1.96
      if (zScore > 1.96) {
        const winner = rateA > rateB ? 'A' as const : 'B' as const;
        const confidence = Math.min(99, Math.round((1 - 2 * (1 - normalCDF(zScore))) * 100));
        
        completeTest.mutate({ id: test.id, winner });
        toast.success(`Vencedor automático: Variante ${winner}`, {
          description: `Confiança estatística de ${confidence}%`,
        });
      }
    }
  };

  // Standard normal CDF approximation
  function normalCDF(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  }

  return {
    tests,
    isLoading,
    error,
    createTest,
    startTest,
    pauseTest,
    completeTest,
    updateMetrics,
    deleteTest,
    checkAutoWinner,
  };
}
