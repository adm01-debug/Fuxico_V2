import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ZapierEvent = 'email.opened' | 'email.clicked' | 'email.bounced' | 'document.viewed' | 'link.clicked';

export interface ZapierWebhook {
  id: string;
  event: ZapierEvent;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
}

export interface ZapierWebhookLog {
  id: string;
  webhook_id: string;
  event: ZapierEvent;
  payload: any;
  response_status: number;
  success: boolean;
  created_at: string;
}

export function useZapier() {
  const [webhooks, setWebhooks] = useState<ZapierWebhook[]>([]);
  const [logs, setLogs] = useState<ZapierWebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadWebhooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapier-webhook/list');
      if (error) throw error;
      setWebhooks(data.webhooks || []);
    } catch (error: any) {
      toast({ title: 'Error loading webhooks', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const registerWebhook = useCallback(async (event: ZapierEvent, webhookUrl: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapier-webhook/register', {
        body: { event, webhook_url: webhookUrl }
      });
      if (error) throw error;
      await loadWebhooks();
      toast({ title: 'Webhook registered', description: `${event} events will be sent to Zapier` });
    } catch (error: any) {
      toast({ title: 'Error registering webhook', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [loadWebhooks, toast]);

  const unregisterWebhook = useCallback(async (event: ZapierEvent): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('zapier-webhook/unregister', {
        body: { event }
      });
      if (error) throw error;
      await loadWebhooks();
      toast({ title: 'Webhook removed' });
    } catch (error: any) {
      toast({ title: 'Error removing webhook', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [loadWebhooks, toast]);

  const testWebhook = useCallback(async (event: ZapierEvent): Promise<boolean> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;
      
      const { error } = await supabase.functions.invoke('zapier-webhook/trigger', {
        body: {
          user_id: user.user.id,
          event,
          payload: { test: true, timestamp: new Date().toISOString(), message: 'Test webhook from FUXICO' }
        }
      });
      if (error) throw error;
      toast({ title: 'Test sent', description: 'Check your Zapier for the test event' });
      return true;
    } catch (error: any) {
      toast({ title: 'Test failed', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const loadLogs = useCallback(async (limit: number = 50) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    
    const { data } = await supabase
      .from('zapier_webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (data) setLogs(data as ZapierWebhookLog[]);
  }, []);

  const getEventDescription = (event: ZapierEvent): string => {
    const descriptions: Record<ZapierEvent, string> = {
      'email.opened': 'Triggers when someone opens your tracked email for the first time',
      'email.clicked': 'Triggers when someone clicks a link in your tracked email',
      'email.bounced': 'Triggers when an email bounces or fails to deliver',
      'document.viewed': 'Triggers when someone views your tracked document',
      'link.clicked': 'Triggers when someone clicks a standalone tracked link'
    };
    return descriptions[event];
  };

  useEffect(() => { loadWebhooks(); }, [loadWebhooks]);

  return {
    webhooks, logs, isLoading,
    loadWebhooks, registerWebhook, unregisterWebhook, testWebhook, loadLogs, getEventDescription,
    availableEvents: ['email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked'] as ZapierEvent[]
  };
}
