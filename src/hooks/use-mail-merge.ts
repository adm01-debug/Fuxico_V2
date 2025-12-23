import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MailMergeField {
  name: string;
  column: string;
  defaultValue?: string;
}

export interface MailMergeTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  fields: MailMergeField[];
  created_at: string;
}

export interface MailMergeRecipient {
  email: string;
  data: Record<string, string>;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

export interface MailMergeCampaign {
  id: string;
  name: string;
  template_id: string;
  recipients: MailMergeRecipient[];
  status: 'draft' | 'sending' | 'completed' | 'paused';
  sent_count: number;
  failed_count: number;
  created_at: string;
  scheduled_at?: string;
}

export function useMailMerge() {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<MailMergeCampaign[]>([]);
  const [templates, setTemplates] = useState<MailMergeTemplate[]>([]);
  const { toast } = useToast();

  const parseGoogleSheet = useCallback(async (sheetUrl: string): Promise<Record<string, string>[]> => {
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error('Invalid Google Sheet URL');
    
    const sheetId = sheetIdMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error('Failed to fetch sheet. Make sure it is publicly accessible.');
    
    const csvText = await response.text();
    const lines = csvText.split('\n').map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
    
    if (lines.length < 2) throw new Error('Sheet must have headers and at least one data row');
    
    const headers = lines[0];
    const data = lines.slice(1).filter(row => row.some(cell => cell)).map(row => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || '';
      });
      return record;
    });
    
    return data;
  }, []);

  const mergeTemplate = useCallback((template: string, data: Record<string, string>, fallbacks: Record<string, string> = {}): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, field) => {
      return data[field] || fallbacks[field] || '';
    });
  }, []);

  const createCampaign = useCallback(async (
    name: string,
    templateId: string,
    sheetUrl: string,
    emailColumn: string = 'email',
    scheduledAt?: Date
  ): Promise<MailMergeCampaign> => {
    setIsLoading(true);
    try {
      const sheetData = await parseGoogleSheet(sheetUrl);
      
      const recipients: MailMergeRecipient[] = sheetData
        .filter(row => row[emailColumn] && row[emailColumn].includes('@'))
        .map(row => ({
          email: row[emailColumn],
          data: row,
          status: 'pending' as const
        }));

      if (recipients.length === 0) throw new Error('No valid email addresses found in sheet');

      const campaign: MailMergeCampaign = {
        id: crypto.randomUUID(),
        name,
        template_id: templateId,
        recipients,
        status: scheduledAt ? 'draft' : 'draft',
        sent_count: 0,
        failed_count: 0,
        created_at: new Date().toISOString(),
        scheduled_at: scheduledAt?.toISOString()
      };

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      await supabase.from('mail_merge_campaigns').insert({
        id: campaign.id,
        user_id: user.user.id,
        name: campaign.name,
        template_id: campaign.template_id,
        recipients: campaign.recipients,
        status: campaign.status,
        sent_count: 0,
        failed_count: 0,
        scheduled_at: campaign.scheduled_at
      });

      setCampaigns(prev => [...prev, campaign]);
      toast({ title: 'Campaign created', description: `${recipients.length} recipients loaded` });
      
      return campaign;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [parseGoogleSheet, toast]);

  const sendCampaign = useCallback(async (
    campaignId: string,
    batchSize: number = 50,
    delayMs: number = 1000
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) throw new Error('Campaign not found');

      const template = templates.find(t => t.id === campaign.template_id);
      if (!template) throw new Error('Template not found');

      await supabase.from('mail_merge_campaigns').update({ status: 'sending' }).eq('id', campaignId);

      const pendingRecipients = campaign.recipients.filter(r => r.status === 'pending');
      
      for (let i = 0; i < pendingRecipients.length; i += batchSize) {
        const batch = pendingRecipients.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(async (recipient) => {
            const subject = mergeTemplate(template.subject, recipient.data);
            const body = mergeTemplate(template.body, recipient.data);
            
            const { error } = await supabase.functions.invoke('send-mail-merge', {
              body: { to: recipient.email, subject, body, campaignId }
            });
            
            if (error) throw error;
            return recipient.email;
          })
        );

        results.forEach((result, index) => {
          const recipient = batch[index];
          if (result.status === 'fulfilled') {
            recipient.status = 'sent';
            campaign.sent_count++;
          } else {
            recipient.status = 'failed';
            recipient.error = result.reason?.message || 'Unknown error';
            campaign.failed_count++;
          }
        });

        await supabase.from('mail_merge_campaigns').update({
          recipients: campaign.recipients,
          sent_count: campaign.sent_count,
          failed_count: campaign.failed_count
        }).eq('id', campaignId);

        if (i + batchSize < pendingRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      await supabase.from('mail_merge_campaigns').update({ status: 'completed' }).eq('id', campaignId);
      toast({ title: 'Campaign completed', description: `Sent: ${campaign.sent_count}, Failed: ${campaign.failed_count}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [campaigns, templates, mergeTemplate, toast]);

  const saveTemplate = useCallback(async (template: Omit<MailMergeTemplate, 'id' | 'created_at'>): Promise<MailMergeTemplate> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const newTemplate: MailMergeTemplate = {
      ...template,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    await supabase.from('mail_merge_templates').insert({
      id: newTemplate.id,
      user_id: user.user.id,
      name: newTemplate.name,
      subject: newTemplate.subject,
      body: newTemplate.body,
      fields: newTemplate.fields
    });

    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  }, []);

  const loadCampaigns = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from('mail_merge_campaigns')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (data) setCampaigns(data as MailMergeCampaign[]);
  }, []);

  const loadTemplates = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from('mail_merge_templates')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (data) setTemplates(data as MailMergeTemplate[]);
  }, []);

  return {
    isLoading,
    campaigns,
    templates,
    parseGoogleSheet,
    mergeTemplate,
    createCampaign,
    sendCampaign,
    saveTemplate,
    loadCampaigns,
    loadTemplates
  };
}
