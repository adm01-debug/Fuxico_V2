/**
 * Hook para insights gerados por IA
 *
 * @description Este hook fornece funcionalidades para hook para insights gerados por ia.
 * Inclui gerenciamento de estado, cache e tratamento de erros.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useaiinsights();
 * ```
 *
 * @returns Object contendo data, isLoading, error e funções auxiliares
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export type InsightPeriod = '7d' | '30d' | '90d' | 'all';

export type InsightType = 'info' | 'success' | 'warning';

export interface Insight {
  type: InsightType;
  title: string;
  description: string;
  metric?: number;
}

/** Contrato real da edge function `ai-insights` (supabase/functions/ai-insights/index.ts). */
export interface InsightsResponse {
  insights: Insight[];
  period: string;
}

export interface InsightsData extends InsightsResponse {
  stats?: {
    totalEmails: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    totalEvents: number;
  };
}

async function fetchInsights(period: InsightPeriod): Promise<InsightsResponse> {
  const { data, error } = await supabase.functions.invoke<InsightsResponse & { error?: string }>(
    'ai-insights',
    { body: { period, includeRecommendations: true } }
  );

  if (data?.error) throw new Error(data.error);
  if (error) throw new Error(error.message || 'Falha ao consultar a análise');
  if (!data) throw new Error('A análise não retornou dados');

  return data;
}

export function useAIInsights(period: InsightPeriod = '30d') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-insights', user?.id, period],
    queryFn: () => fetchInsights(period),
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useRefreshInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (period: InsightPeriod) => fetchInsights(period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });
}
