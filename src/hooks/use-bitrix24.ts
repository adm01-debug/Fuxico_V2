import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export interface Bitrix24Config {
  enabled: boolean;
  webhookUrl: string | null;
  autoSyncContacts: boolean;
  autoRegisterActivities: boolean;
  autoCreateDeals: boolean;
  sendNotifications: boolean;
  defaultDealStage: string;
  defaultDealCategory: string;
}

export interface Bitrix24Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  lastActivity?: string;
}

export interface Bitrix24Activity {
  id: string;
  type: 'email_open' | 'link_click' | 'document_view';
  subject: string;
  contactId: string;
  contactName: string;
  timestamp: string;
}

export interface Bitrix24Deal {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  stage: string;
  value?: number;
  currency?: string;
  createdAt: string;
}

interface SyncResult {
  success: boolean;
  contactId?: number;
  activityId?: number;
  dealId?: number;
  isNew?: boolean;
  message?: string;
  error?: string;
}

// ============================================
// API HELPERS
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function callBitrix24API<T = SyncResult>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/bitrix24-sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, data }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || result.error || 'API request failed');
  }

  return result;
}

// ============================================
// CONFIG HOOK - USING bitrix24_config TABLE
// ============================================

export function useBitrix24Config() {
  const queryClient = useQueryClient();

  const query = useQuery<Bitrix24Config>({
    queryKey: ['bitrix24-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bitrix24_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        
        throw error;
      }

      // Return defaults if no config exists
      if (!data) {
        return {
          enabled: true,
          webhookUrl: null,
          autoSyncContacts: true,
          autoRegisterActivities: true,
          autoCreateDeals: false,
          sendNotifications: true,
          defaultDealStage: 'NEW',
          defaultDealCategory: '0',
        };
      }

      return {
        enabled: data.enabled,
        webhookUrl: data.webhook_url,
        autoSyncContacts: data.auto_sync_contacts,
        autoRegisterActivities: data.auto_register_activities,
        autoCreateDeals: data.auto_create_deals,
        sendNotifications: data.send_notifications,
        defaultDealStage: data.default_deal_stage,
        defaultDealCategory: data.default_deal_category,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Bitrix24Config>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dbUpdates: Record<string, unknown> = {};
      if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
      if (updates.webhookUrl !== undefined) dbUpdates.webhook_url = updates.webhookUrl;
      if (updates.autoSyncContacts !== undefined) dbUpdates.auto_sync_contacts = updates.autoSyncContacts;
      if (updates.autoRegisterActivities !== undefined) dbUpdates.auto_register_activities = updates.autoRegisterActivities;
      if (updates.autoCreateDeals !== undefined) dbUpdates.auto_create_deals = updates.autoCreateDeals;
      if (updates.sendNotifications !== undefined) dbUpdates.send_notifications = updates.sendNotifications;
      if (updates.defaultDealStage !== undefined) dbUpdates.default_deal_stage = updates.defaultDealStage;
      if (updates.defaultDealCategory !== undefined) dbUpdates.default_deal_category = updates.defaultDealCategory;

      const { data, error } = await supabase
        .from('bitrix24_config')
        .upsert({
          user_id: user.id,
          ...dbUpdates,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24-config'] });
      queryClient.invalidateQueries({ queryKey: ['bitrix24'] });
      toast.success('Configuração do Bitrix24 salva');
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    },
  });

  const updateConfig = useCallback(async (updates: Partial<Bitrix24Config>) => {
    await updateMutation.mutateAsync(updates);
  }, [updateMutation]);

  return { 
    config: query.data || {
      enabled: true,
      webhookUrl: null,
      autoSyncContacts: true,
      autoRegisterActivities: true,
      autoCreateDeals: false,
      sendNotifications: true,
      defaultDealStage: 'NEW',
      defaultDealCategory: '0',
    }, 
    updateConfig,
    isLoading: query.isLoading,
    isUpdating: updateMutation.isPending,
  };
}

// ============================================
// DATA HOOKS - REAL API ONLY (NO MOCK FALLBACK)
// ============================================

export function useBitrix24Contacts() {
  const { config } = useBitrix24Config();

  return useQuery<Bitrix24Contact[]>({
    queryKey: ['bitrix24', 'contacts', config.webhookUrl],
    queryFn: async () => {
      if (!config.webhookUrl) {
        return [];
      }
      
      const result = await callBitrix24API<{ success: boolean; contacts: Bitrix24Contact[] }>(
        'get_contacts', 
        { limit: 50 }
      );
      
      return result.contacts || [];
    },
    enabled: !!config.webhookUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBitrix24Activities() {
  const { config } = useBitrix24Config();

  return useQuery<Bitrix24Activity[]>({
    queryKey: ['bitrix24', 'activities', config.webhookUrl],
    queryFn: async () => {
      if (!config.webhookUrl) {
        return [];
      }
      
      const result = await callBitrix24API<{ success: boolean; activities: Bitrix24Activity[] }>(
        'get_activities',
        { limit: 50 }
      );
      
      return result.activities || [];
    },
    enabled: !!config.webhookUrl,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useBitrix24Deals() {
  const { config } = useBitrix24Config();

  return useQuery<Bitrix24Deal[]>({
    queryKey: ['bitrix24', 'deals', config.webhookUrl],
    queryFn: async () => {
      if (!config.webhookUrl) {
        return [];
      }
      
      const result = await callBitrix24API<{ success: boolean; deals: Bitrix24Deal[] }>(
        'get_deals',
        { limit: 50 }
      );
      
      return result.deals || [];
    },
    enabled: !!config.webhookUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useSyncContact() {
  const queryClient = useQueryClient();
  const { config } = useBitrix24Config();

  return useMutation({
    mutationFn: async ({ email, name, phone, company }: { 
      email: string; 
      name?: string;
      phone?: string;
      company?: string;
    }) => {
      if (!config.webhookUrl) {
        throw new Error('Bitrix24 não configurado');
      }
      
      return callBitrix24API('sync_contact', { email, name, phone, company });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'contacts'] });
      if (result.isNew) {
        toast.success('Contato criado no Bitrix24');
      }
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar contato: ${error.message}`);
    },
  });
}

export function useRegisterActivity() {
  const queryClient = useQueryClient();
  const { config } = useBitrix24Config();

  return useMutation({
    mutationFn: async ({
      type,
      subject,
      email,
      trackingId,
      description,
    }: {
      type: Bitrix24Activity['type'];
      subject: string;
      email: string;
      trackingId?: string;
      description?: string;
    }) => {
      if (!config.webhookUrl) {
        throw new Error('Bitrix24 não configurado');
      }
      
      return callBitrix24API('register_activity', { 
        type, 
        subject, 
        email,
        trackingId,
        description: description || `${type}: ${subject}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'activities'] });
    },
    onError: (error) => {
      
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { config } = useBitrix24Config();

  return useMutation({
    mutationFn: async ({
      title,
      email,
      value,
      source,
    }: {
      title: string;
      email: string;
      value?: number;
      source?: string;
    }) => {
      if (!config.webhookUrl) {
        throw new Error('Bitrix24 não configurado');
      }
      
      return callBitrix24API('create_deal', { title, email, value, source });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'deals'] });
      if (result.isNew) {
        toast.success('Negócio criado no Bitrix24');
      }
    },
    onError: (error) => {
      toast.error(`Erro ao criar negócio: ${error.message}`);
    },
  });
}

export function useSendNotification() {
  const { config } = useBitrix24Config();

  return useMutation({
    mutationFn: async ({ message, userId }: { message: string; userId?: number }) => {
      if (!config.webhookUrl) {
        throw new Error('Bitrix24 não configurado');
      }
      
      return callBitrix24API('send_notification', { message, userId });
    },
    onSuccess: () => {
      toast.success('Notificação enviada');
    },
    onError: (error) => {
      toast.error(`Erro ao enviar notificação: ${error.message}`);
    },
  });
}

// ============================================
// UTILITY HOOK - Check if using real data
// ============================================

export function useBitrix24Status() {
  const { config, isLoading } = useBitrix24Config();
  
  return {
    isConfigured: !!config.webhookUrl,
    isLoading,
    config,
  };
}

// ============================================
// TEST CONNECTION HOOK
// ============================================

export function useTestBitrix24Connection() {
  return useMutation({
    mutationFn: async () => {
      const result = await callBitrix24API<{ success: boolean; contacts: Bitrix24Contact[] }>(
        'get_contacts', 
        { limit: 1 }
      );
      return result;
    },
    onSuccess: () => {
      toast.success('Conexão com Bitrix24 funcionando!');
    },
    onError: (error) => {
      toast.error(`Erro na conexão: ${error.message}`);
    },
  });
}
