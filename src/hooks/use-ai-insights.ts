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
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InsightsData {
  insights: string;
  stats: {
    totalEmails: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    bestHours: Array<{ hour: number; opens: number; clicks: number; total: number }>;
    bestDays: Array<{ day: number; dayName: string; opens: number; clicks: number; total: number }>;
    totalEvents: number;
  };
}

export function useAIInsights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-insights', user?.id],
    queryFn: async (): Promise<InsightsData> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch insights');
      }

      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useRefreshInsights() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<InsightsData> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh insights');
      }

      return response.json();
    },
  });
}
