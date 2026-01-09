/**
 * Hook para gerenciamento de campanhas de email marketing
 * @description Hook para gerenciamento de campanhas de email marketing. Inclui gerenciamento de estado e cache.
 * @returns Object com data, isLoading, error
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithStats extends Campaign {
  total_emails: number;
  total_opens: number;
  total_clicks: number;
  open_rate: number;
  click_rate: number;
}

export function useCampaigns() {
  const { user } = useAuth();

  return useQuery({
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    queryKey: ['campaigns', user?.id],
    queryFn: async (): Promise<CampaignWithStats[]> => {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stats for each campaign
      const campaignsWithStats: CampaignWithStats[] = await Promise.all(
        (campaigns || []).map(async (campaign) => {
          const { data: emails } = await supabase
            .from('tracked_emails')
            .select('tracking_id')
            .eq('campaign_id', campaign.id);

          const trackingIds = emails?.map(e => e.tracking_id) || [];
          
          let totalOpens = 0;
          let totalClicks = 0;

          if (trackingIds.length > 0) {
            const { data: events } = await supabase
              .from('tracking_events')
              .select('event_type')
              .in('tracking_id', trackingIds);

            totalOpens = events?.filter(e => e.event_type === 'open').length || 0;
            totalClicks = events?.filter(e => e.event_type === 'click').length || 0;
          }

          const totalEmails = trackingIds.length;
          const openRate = totalEmails > 0 ? Math.round((totalOpens / totalEmails) * 100) : 0;
          const clickRate = totalOpens > 0 ? Math.round((totalClicks / totalOpens) * 100) : 0;

          return {
            ...campaign,
            total_emails: totalEmails,
            total_opens: totalOpens,
            total_clicks: totalClicks,
            open_rate: openRate,
            click_rate: clickRate,
          };
        })
      );

      return campaignsWithStats;
    },
    enabled: !!user,
  });
}

export function useCreateCampaign() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user!.id,
          name: data.name,
          description: data.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar campanha: ' + error.message);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string }) => {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar campanha: ' + error.message);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir campanha: ' + error.message);
    },
  });
}

export function useAssignEmailToCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackingId, campaignId }: { trackingId: string; campaignId: string | null }) => {
      const { error } = await supabase
        .from('tracked_emails')
        .update({ campaign_id: campaignId })
        .eq('tracking_id', trackingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['tracked-emails'] });
    },
  });
}
