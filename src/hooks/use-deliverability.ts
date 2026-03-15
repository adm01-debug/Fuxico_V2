/**
 * Hook para métricas de entregabilidade
 * @description Hook para métricas de entregabilidade. Inclui gerenciamento de estado e cache.
 * @returns Object com data, isLoading, error
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DomainStats {
  domain: string;
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_opened: number;
  bounce_rate: number;
  open_rate: number;
  delivery_rate: number;
  reputation_score: number;
}

export interface DeliverabilityTotals {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalOpened: number;
  deliveryRate: number;
  bounceRate: number;
  openRate: number;
  reputationScore: number;
}

export interface DNSCheckResult {
  domain: string;
  dns: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
  };
  recommendations: string[];
}

export interface BlacklistResult {
  domain: string;
  listed: boolean;
  totalChecked: number;
  totalListed: number;
  results: Array<{
    blacklist: string;
    host: string;
    listed: boolean;
    description: string;
  }>;
  checkedAt: string;
  riskLevel: string;
  recommendations: string[];
}

export interface DeliverabilityData {
  domains: DomainStats[];
  totals: DeliverabilityTotals;
}

export function useDeliverability() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<DeliverabilityData>({
    queryKey: ['deliverability-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use RPC to get domain stats instead of edge function
      const { data: domainStats, error: rpcError } = await supabase.rpc('calculate_domain_deliverability', {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;

      const domains = (domainStats || []) as DomainStats[];

      // Calculate totals
      const totalSent = domains.reduce((sum, d) => sum + Number(d.total_sent), 0);
      const totalDelivered = domains.reduce((sum, d) => sum + Number(d.total_delivered), 0);
      const totalBounced = domains.reduce((sum, d) => sum + Number(d.total_bounced), 0);
      const totalOpened = domains.reduce((sum, d) => sum + Number(d.total_opened), 0);

      const totals: DeliverabilityTotals = {
        totalSent,
        totalDelivered,
        totalBounced,
        totalOpened,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        reputationScore: domains.length > 0
          ? Math.round(domains.reduce((sum, d) => sum + Number(d.reputation_score), 0) / domains.length)
          : 50,
      };

      return { domains, totals };
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!queryClient,
  });

  const checkDNSMutation = useMutation({
    mutationFn: async (domain: string): Promise<DNSCheckResult> => {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-deliverability?action=check-dns&domain=${encodeURIComponent(domain)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check DNS');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverability-stats'] });
    },
  });

  const checkBlacklistMutation = useMutation({
    mutationFn: async (domain: string): Promise<BlacklistResult> => {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-deliverability?action=check-blacklist&domain=${encodeURIComponent(domain)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check blacklist');
      }

      return response.json();
    },
  });

  const getReputationLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: 'Excelente', color: 'text-green-600' };
    if (score >= 60) return { level: 'Bom', color: 'text-blue-600' };
    if (score >= 40) return { level: 'Regular', color: 'text-yellow-600' };
    if (score >= 20) return { level: 'Baixo', color: 'text-orange-600' };
    return { level: 'Crítico', color: 'text-red-600' };
  };

  const getDeliveryHealthStatus = (rate: number): { status: string; color: string } => {
    if (rate >= 95) return { status: 'Saudável', color: 'bg-green-500' };
    if (rate >= 90) return { status: 'Bom', color: 'bg-blue-500' };
    if (rate >= 80) return { status: 'Atenção', color: 'bg-yellow-500' };
    return { status: 'Crítico', color: 'bg-red-500' };
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    checkDNS: checkDNSMutation.mutate,
    isCheckingDNS: checkDNSMutation.isPending,
    dnsResult: checkDNSMutation.data,
    checkBlacklist: checkBlacklistMutation.mutate,
    isCheckingBlacklist: checkBlacklistMutation.isPending,
    blacklistResult: checkBlacklistMutation.data,
    getReputationLevel,
    getDeliveryHealthStatus,
  };
}
