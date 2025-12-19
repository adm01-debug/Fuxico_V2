import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TIPOS
// ============================================

export interface Bitrix24Config {
  enabled: boolean;
  useMock: boolean;
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
  type: 'email_open' | 'link_click' | 'document_view' | 'email_sent';
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

async function callBitrix24API(action: string, data: Record<string, unknown>): Promise<SyncResult> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/bitrix24-sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'API request failed');
  }

  return response.json();
}

// ============================================
// CONFIG HOOK
// ============================================

export function useBitrix24Config() {
  const [config, setConfig] = useState<Bitrix24Config>({
    enabled: true,
    useMock: true,
    webhookUrl: null,
    autoSyncContacts: true,
    autoRegisterActivities: true,
    autoCreateDeals: false,
    sendNotifications: true,
    defaultDealStage: 'NEW',
    defaultDealCategory: '0',
  });

  // Carregar config do banco
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('user_preferences')
          .select('bitrix24_config')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.bitrix24_config) {
          const dbConfig = data.bitrix24_config as Record<string, unknown>;
          setConfig(prev => ({
            ...prev,
            webhookUrl: (dbConfig.webhook_url as string) || null,
            useMock: !dbConfig.webhook_url,
            autoSyncContacts: dbConfig.auto_sync_contacts as boolean ?? true,
            autoRegisterActivities: dbConfig.auto_register_activities as boolean ?? true,
            autoCreateDeals: dbConfig.auto_create_deals as boolean ?? false,
            sendNotifications: dbConfig.send_notifications as boolean ?? true,
            defaultDealStage: (dbConfig.default_deal_stage as string) || 'NEW',
            defaultDealCategory: (dbConfig.default_deal_category as string) || '0',
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar config Bitrix24:', error);
      }
    }
    loadConfig();
  }, []);

  const updateConfig = useCallback(async (updates: Partial<Bitrix24Config>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Converter para formato do banco
      const dbUpdates: Record<string, unknown> = {};
      if (updates.webhookUrl !== undefined) dbUpdates.webhook_url = updates.webhookUrl;
      if (updates.autoSyncContacts !== undefined) dbUpdates.auto_sync_contacts = updates.autoSyncContacts;
      if (updates.autoRegisterActivities !== undefined) dbUpdates.auto_register_activities = updates.autoRegisterActivities;
      if (updates.autoCreateDeals !== undefined) dbUpdates.auto_create_deals = updates.autoCreateDeals;
      if (updates.sendNotifications !== undefined) dbUpdates.send_notifications = updates.sendNotifications;
      if (updates.defaultDealStage !== undefined) dbUpdates.default_deal_stage = updates.defaultDealStage;
      if (updates.defaultDealCategory !== undefined) dbUpdates.default_deal_category = updates.defaultDealCategory;

      // Upsert preferências
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          bitrix24_config: dbUpdates,
        }, {
          onConflict: 'user_id',
        });

      // Atualizar estado local
      setConfig(prev => ({
        ...prev,
        ...updates,
        useMock: updates.webhookUrl ? false : !prev.webhookUrl,
      }));

    } catch (error) {
      console.error('Erro ao salvar config Bitrix24:', error);
      throw error;
    }
  }, []);

  return { config, updateConfig };
}

// ============================================
// DATA HOOKS (USANDO EDGE FUNCTION OU MOCK)
// ============================================

// Mock data para quando Bitrix24 não está configurado
const mockContacts: Bitrix24Contact[] = [
  { id: '1', name: 'João Silva', email: 'joao@empresa.com', company: 'Empresa ABC', lastActivity: new Date().toISOString() },
  { id: '2', name: 'Maria Santos', email: 'maria@cliente.com', phone: '11999998888', lastActivity: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', name: 'Carlos Oliveira', email: 'carlos@parceiro.com', company: 'Parceiro XYZ', source: 'FUXICO' },
];

const mockActivities: Bitrix24Activity[] = [
  { id: '1', type: 'email_open', subject: 'Proposta comercial', contactId: '1', contactName: 'João Silva', timestamp: new Date().toISOString() },
  { id: '2', type: 'link_click', subject: 'Link do catálogo', contactId: '2', contactName: 'Maria Santos', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'document_view', subject: 'Apresentação.pdf', contactId: '1', contactName: 'João Silva', timestamp: new Date(Date.now() - 7200000).toISOString() },
];

const mockDeals: Bitrix24Deal[] = [
  { id: '1', title: 'Brindes Personalizados - ABC', contactId: '1', contactName: 'João Silva', stage: 'Proposta', value: 15000, currency: 'BRL', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '2', title: 'Kits Corporativos', contactId: '2', contactName: 'Maria Santos', stage: 'Negociação', value: 8500, currency: 'BRL', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export function useBitrix24Contacts() {
  const { config } = useBitrix24Config();

  return useQuery<Bitrix24Contact[]>({
    queryKey: ['bitrix24', 'contacts', config.useMock],
    queryFn: async () => {
      if (config.useMock) {
        return mockContacts;
      }
      
      // TODO: Implementar busca real via Edge Function
      // Por enquanto retorna mock mesmo com webhook configurado
      return mockContacts;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useBitrix24Activities() {
  const { config } = useBitrix24Config();

  return useQuery<Bitrix24Activity[]>({
    queryKey: ['bitrix24', 'activities', config.useMock],
    queryFn: async () => {
      if (config.useMock) {
        return mockActivities;
      }
      
      return mockActivities;
    },
    staleTime: 1000 * 60,
  });
}

export function useBitrix24Deals() {
  const { config } = useBitrix24Config();

  return useQuery<Bitrix24Deal[]>({
    queryKey: ['bitrix24', 'deals', config.useMock],
    queryFn: async () => {
      if (config.useMock) {
        return mockDeals;
      }
      
      return mockDeals;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// MUTATION HOOKS (EDGE FUNCTION)
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
      if (config.useMock) {
        // Simular delay e retorno mock
        await new Promise(r => setTimeout(r, 500));
        return { success: true, contactId: Math.floor(Math.random() * 1000), isNew: true };
      }
      
      return callBitrix24API('sync_contact', { email, name, phone, company });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'contacts'] });
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
      if (config.useMock) {
        await new Promise(r => setTimeout(r, 500));
        return { success: true, activityId: Math.floor(Math.random() * 1000) };
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
      if (config.useMock) {
        await new Promise(r => setTimeout(r, 500));
        return { success: true, dealId: Math.floor(Math.random() * 1000), isNew: true };
      }
      
      return callBitrix24API('create_deal', { title, email, value, source });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'deals'] });
    },
  });
}

export function useSendNotification() {
  const { config } = useBitrix24Config();

  return useMutation({
    mutationFn: async ({ message, userId }: { message: string; userId?: number }) => {
      if (config.useMock) {
        await new Promise(r => setTimeout(r, 200));
        return { success: true };
      }
      
      return callBitrix24API('send_notification', { message, userId });
    },
  });
}
