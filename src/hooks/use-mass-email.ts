import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  from_name?: string;
  reply_to?: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled';
  total_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  batch_size: number;
  batch_delay_ms: number;
  created_at: string;
}

export interface CampaignStats {
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

const MONTHLY_LIMIT = 60000;

export function useMassEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const { toast } = useToast();

  const loadCampaigns = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('email_campaigns').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false });
    if (data) setCampaigns(data as EmailCampaign[]);
  }, []);

  const getMonthlyUsage = useCallback(async (): Promise<number> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const { data } = await supabase.from('email_campaigns').select('sent_count').eq('user_id', user.user.id).gte('created_at', startOfMonth.toISOString());
    const usage = data?.reduce((acc, c) => acc + (c.sent_count || 0), 0) || 0;
    setMonthlyUsage(usage);
    return usage;
  }, []);

  const createCampaign = useCallback(async (campaign: Partial<EmailCampaign>): Promise<EmailCampaign> => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const usage = await getMonthlyUsage();
      const recipientCount = campaign.recipients?.length || 0;
      if (usage + recipientCount > MONTHLY_LIMIT) throw new Error(`Monthly limit exceeded. ${MONTHLY_LIMIT - usage} emails remaining.`);

      const newCampaign: Partial<EmailCampaign> = {
        ...campaign,
        id: crypto.randomUUID(),
        status: campaign.scheduled_at ? 'scheduled' : 'draft',
        total_count: recipientCount,
        sent_count: 0, opened_count: 0, clicked_count: 0, bounced_count: 0, unsubscribed_count: 0,
        batch_size: campaign.batch_size || 50,
        batch_delay_ms: campaign.batch_delay_ms || 2000,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('email_campaigns').insert({ ...newCampaign, user_id: user.user.id }).select().single();
      if (error) throw error;
      setCampaigns(prev => [data as EmailCampaign, ...prev]);
      toast({ title: 'Campaign created', description: `${recipientCount} recipients added` });
      return data as EmailCampaign;
    } finally { setIsLoading(false); }
  }, [getMonthlyUsage, toast]);

  const sendCampaign = useCallback(async (campaignId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) throw new Error('Campaign not found');
      await supabase.from('email_campaigns').update({ status: 'sending', started_at: new Date().toISOString() }).eq('id', campaignId);
      const { error } = await supabase.functions.invoke('send-mass-email', { body: { campaignId } });
      if (error) throw error;
      toast({ title: 'Campaign started', description: 'Emails are being sent in batches' });
      await loadCampaigns();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [campaigns, loadCampaigns, toast]);

  const pauseCampaign = useCallback(async (campaignId: string): Promise<void> => {
    await supabase.from('email_campaigns').update({ status: 'paused' }).eq('id', campaignId);
    await loadCampaigns();
    toast({ title: 'Campaign paused' });
  }, [loadCampaigns, toast]);

  const resumeCampaign = useCallback(async (campaignId: string): Promise<void> => {
    await sendCampaign(campaignId);
  }, [sendCampaign]);

  const cancelCampaign = useCallback(async (campaignId: string): Promise<void> => {
    await supabase.from('email_campaigns').update({ status: 'cancelled' }).eq('id', campaignId);
    await loadCampaigns();
    toast({ title: 'Campaign cancelled' });
  }, [loadCampaigns, toast]);

  const getCampaignStats = useCallback((campaign: EmailCampaign): CampaignStats => {
    const sent = campaign.sent_count || 1;
    return {
      openRate: (campaign.opened_count / sent) * 100,
      clickRate: (campaign.clicked_count / sent) * 100,
      bounceRate: (campaign.bounced_count / sent) * 100,
      unsubscribeRate: (campaign.unsubscribed_count / sent) * 100
    };
  }, []);

  const duplicateCampaign = useCallback(async (campaignId: string): Promise<EmailCampaign> => {
    const original = campaigns.find(c => c.id === campaignId);
    if (!original) throw new Error('Campaign not found');
    return createCampaign({ ...original, name: `${original.name} (Copy)`, status: 'draft', scheduled_at: undefined });
  }, [campaigns, createCampaign]);

  return {
    isLoading, campaigns, monthlyUsage, remainingEmails: MONTHLY_LIMIT - monthlyUsage,
    loadCampaigns, getMonthlyUsage, createCampaign, sendCampaign, pauseCampaign, resumeCampaign, cancelCampaign, getCampaignStats, duplicateCampaign
  };
}
