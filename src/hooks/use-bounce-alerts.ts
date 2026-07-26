/**
 * Hook para alertas de bounce de emails
 * 
 * @description Este hook fornece funcionalidades para hook para alertas de bounce de emails.
 * Inclui gerenciamento de estado, cache e tratamento de erros.
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = usebouncealerts();
 * ```
 * 
 * @returns Object contendo data, isLoading, error e funções auxiliares
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface BounceAlert {
  id: string;
  user_id: string;
  domain: string;
  bounce_rate: number;
  threshold: number;
  alert_type: string;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface AlertThresholds {
  id: string;
  user_id: string;
  bounce_rate_warning: number;
  bounce_rate_critical: number;
  low_delivery_rate: number;
  low_open_rate: number;
  created_at: string;
  updated_at: string;
}

const defaultThresholds = {
  bounce_rate_warning: 5.0,
  bounce_rate_critical: 10.0,
  low_delivery_rate: 90.0,
  low_open_rate: 10.0,
};

export function useBounceAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    queryKey: ['bounce-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bounce_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BounceAlert[];
    },
    enabled: !!user?.id,
  });

  const thresholdsQuery = useQuery({
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    queryKey: ['alert-thresholds', user?.id],
    queryFn: async () => {
      if (!user?.id) return defaultThresholds;

      const { data, error } = await supabase
        .from('alert_thresholds')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create default thresholds
        const { data: newData, error: insertError } = await supabase
          .from('alert_thresholds')
          .insert({ user_id: user.id, ...defaultThresholds })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData as AlertThresholds;
      }

      return data as AlertThresholds;
    },
    enabled: !!user?.id,
  });

  const updateThresholds = useMutation({
    mutationFn: async (thresholds: Partial<AlertThresholds>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('alert_thresholds')
        .update({ ...thresholds, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      toast.success('Limites atualizados com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar limites');
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('bounce_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bounce-alerts'] });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('bounce_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bounce-alerts'] });
      toast.success('Alerta resolvido');
    },
  });

  const checkAndCreateAlerts = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current domain stats
      const { data: domains, error: domainsError } = await supabase
        .from('domain_reputation')
        .select('domain, bounce_rate')
        .eq('user_id', user.id);

      if (domainsError) throw domainsError;

      const thresholds = thresholdsQuery.data || defaultThresholds;

      // Batch: fetch ALL unresolved alerts in ONE query (instead of N+1)
      const domainNames = (domains || []).filter(d => d.domain).map(d => d.domain as string);
      const { data: existingAlerts } = await supabase
        .from('bounce_alerts')
        .select('domain')
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .in('domain', domainNames);

      const existingAlertDomains = new Set((existingAlerts || []).map(a => a.domain));

      const newAlerts: Array<{
        user_id: string;
        domain: string;
        bounce_rate: number;
        threshold: number;
        alert_type: string;
      }> = [];

      for (const domain of domains || []) {
        if (domain.bounce_rate && domain.bounce_rate >= thresholds.bounce_rate_warning) {
          if (!existingAlertDomains.has(domain.domain) && domain.domain) {
            const isCritical = domain.bounce_rate >= thresholds.bounce_rate_critical;
            newAlerts.push({
              user_id: user.id,
              domain: domain.domain as string,
              bounce_rate: domain.bounce_rate,
              threshold: isCritical ? thresholds.bounce_rate_critical : thresholds.bounce_rate_warning,
              alert_type: isCritical ? 'critical_bounce_rate' : 'high_bounce_rate',
            });
          }
        }
      }

      if (newAlerts.length > 0) {
        const { error: insertError } = await supabase
          .from('bounce_alerts')
          .insert(newAlerts);

        if (insertError) throw insertError;
      }

      return newAlerts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['bounce-alerts'] });
      if (count > 0) {
        toast.warning(`${count} novo(s) alerta(s) de bounce detectado(s)`);
      }
    },
  });

  const unreadCount = alertsQuery.data?.filter(a => !a.is_read && !a.is_resolved).length || 0;

  return {
    alerts: alertsQuery.data || [],
    thresholds: thresholdsQuery.data,
    isLoading: alertsQuery.isLoading || thresholdsQuery.isLoading,
    unreadCount,
    updateThresholds: updateThresholds.mutate,
    markAsRead: markAsRead.mutate,
    resolveAlert: resolveAlert.mutate,
    checkAlerts: checkAndCreateAlerts.mutate,
    isCheckingAlerts: checkAndCreateAlerts.isPending,
  };
}
