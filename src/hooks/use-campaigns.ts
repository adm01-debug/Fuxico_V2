/**
 * Hook para gerenciamento de campanhas de email marketing
 * @description Hook para gerenciamento de campanhas de email marketing. Inclui gerenciamento de estado e cache.
 * @returns Object com data, isLoading, error
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { requireUserId } from "@/lib/auth-guards";

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
        .eq('user_id', requireUserId(user))
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!campaigns || campaigns.length === 0) return [];

      // Batch: fetch all emails for all campaigns in ONE query
      const campaignIds = campaigns.map(c => c.id);
      const { data: allEmails } = await supabase
        .from('tracked_emails')
        .select('campaign_id, tracking_id')
        .in('campaign_id', campaignIds);

      // Group tracking IDs by campaign
      const emailsByCampaign = new Map<string, string[]>();
      for (const email of allEmails || []) {
        if (!email.campaign_id) continue;
        const list = emailsByCampaign.get(email.campaign_id) || [];
        list.push(email.tracking_id);
        emailsByCampaign.set(email.campaign_id, list);
      }

      // Batch: fetch all events for all tracking IDs in ONE query
      const allTrackingIds = Array.from(emailsByCampaign.values()).flat();
      const eventsByTrackingId = new Map<string, { opens: number; clicks: number }>();

      if (allTrackingIds.length > 0) {
        const { data: allEvents } = await supabase
          .from('tracking_events')
          .select('tracking_id, event_type')
          .in('tracking_id', allTrackingIds);

        for (const event of allEvents || []) {
          const stats = eventsByTrackingId.get(event.tracking_id) || { opens: 0, clicks: 0 };
          if (event.event_type === 'open') stats.opens++;
          else if (event.event_type === 'click') stats.clicks++;
          eventsByTrackingId.set(event.tracking_id, stats);
        }
      }

      // Compute stats per campaign
      return campaigns.map(campaign => {
        const trackingIds = emailsByCampaign.get(campaign.id) || [];
        const totalEmails = trackingIds.length;
        let totalOpens = 0;
        let totalClicks = 0;

        for (const tid of trackingIds) {
          const stats = eventsByTrackingId.get(tid);
          if (stats) {
            totalOpens += stats.opens;
            totalClicks += stats.clicks;
          }
        }

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
      });
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
          user_id: requireUserId(user),
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
