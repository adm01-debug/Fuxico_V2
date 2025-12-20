// =============================================================================
// FUXICO - Generic CRM Hook
// Arquivo: src/hooks/use-crm.ts
// Descrição: Hook React para abstração de CRM genérica
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  crmManager, 
  type CRMProviderType, 
  type CRMConfig,
  type CRMContact,
  type CRMActivity,
  type CRMDeal,
  getSupportedProviders,
} from '@/lib/crm';

// =============================================================================
// STATUS HOOK
// =============================================================================

export function useCRMStatus() {
  const [status, setStatus] = useState(() => crmManager.getStatus());
  
  useEffect(() => {
    // Update status on mount and when provider changes
    setStatus(crmManager.getStatus());
  }, []);
  
  const setActiveProvider = useCallback((type: CRMProviderType | null) => {
    crmManager.setActiveProvider(type);
    setStatus(crmManager.getStatus());
  }, []);
  
  return {
    ...status,
    setActiveProvider,
    supportedProviders: getSupportedProviders(),
  };
}

// =============================================================================
// CONFIG HOOK
// =============================================================================

export function useCRMConfig() {
  const queryClient = useQueryClient();
  const { activeProvider } = useCRMStatus();
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['crm', 'config', activeProvider],
    queryFn: () => crmManager.getConfig(),
    enabled: !!activeProvider,
  });
  
  const updateConfig = useCallback(async (updates: Partial<CRMConfig>) => {
    await crmManager.updateConfig(updates);
    queryClient.invalidateQueries({ queryKey: ['crm', 'config'] });
  }, [queryClient]);
  
  return {
    config,
    isLoading,
    updateConfig,
  };
}

// =============================================================================
// CONTACTS HOOK
// =============================================================================

export function useCRMContacts(limit?: number) {
  const { activeProvider } = useCRMStatus();
  
  return useQuery<CRMContact[]>({
    queryKey: ['crm', 'contacts', activeProvider, limit],
    queryFn: () => crmManager.getContacts(limit),
    enabled: !!activeProvider,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// =============================================================================
// ACTIVITIES HOOK
// =============================================================================

export function useCRMActivities(limit?: number) {
  const { activeProvider } = useCRMStatus();
  
  return useQuery<CRMActivity[]>({
    queryKey: ['crm', 'activities', activeProvider, limit],
    queryFn: () => crmManager.getActivities(limit),
    enabled: !!activeProvider,
    staleTime: 1000 * 60, // 1 minute
  });
}

// =============================================================================
// DEALS HOOK
// =============================================================================

export function useCRMDeals(limit?: number) {
  const { activeProvider } = useCRMStatus();
  
  return useQuery<CRMDeal[]>({
    queryKey: ['crm', 'deals', activeProvider, limit],
    queryFn: () => crmManager.getDeals(limit),
    enabled: !!activeProvider,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export function useSyncCRMContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      email, 
      name, 
      metadata 
    }: { 
      email: string; 
      name?: string; 
      metadata?: Record<string, unknown>;
    }) => {
      return crmManager.syncContact(email, name, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts'] });
    },
  });
}

export function useRegisterCRMActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      type,
      subject,
      contactEmail,
      metadata,
    }: {
      type: CRMActivity['type'];
      subject: string;
      contactEmail: string;
      metadata?: Record<string, unknown>;
    }) => {
      return crmManager.registerActivity(type, subject, contactEmail, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'activities'] });
    },
  });
}

export function useCreateCRMDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      title,
      contactEmail,
      value,
      metadata,
    }: {
      title: string;
      contactEmail: string;
      value?: number;
      metadata?: Record<string, unknown>;
    }) => {
      return crmManager.createDeal(title, contactEmail, value, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
    },
  });
}

export function useSendCRMNotification() {
  return useMutation({
    mutationFn: async ({ 
      message, 
      userId 
    }: { 
      message: string; 
      userId?: string;
    }) => {
      return crmManager.sendNotification(message, userId);
    },
  });
}

// =============================================================================
// TEST CONNECTION HOOK
// =============================================================================

export function useTestCRMConnection() {
  return useMutation({
    mutationFn: () => crmManager.testConnection(),
  });
}

// =============================================================================
// COMBINED HOOK
// =============================================================================

export function useCRM() {
  const status = useCRMStatus();
  const { config, updateConfig } = useCRMConfig();
  const contacts = useCRMContacts();
  const activities = useCRMActivities();
  const deals = useCRMDeals();
  const syncContact = useSyncCRMContact();
  const registerActivity = useRegisterCRMActivity();
  const createDeal = useCreateCRMDeal();
  const sendNotification = useSendCRMNotification();
  const testConnection = useTestCRMConnection();
  
  return useMemo(() => ({
    // Status
    ...status,
    config,
    updateConfig,
    
    // Queries
    contacts: contacts.data || [],
    activities: activities.data || [],
    deals: deals.data || [],
    isLoadingContacts: contacts.isLoading,
    isLoadingActivities: activities.isLoading,
    isLoadingDeals: deals.isLoading,
    refetchContacts: contacts.refetch,
    refetchActivities: activities.refetch,
    refetchDeals: deals.refetch,
    
    // Mutations
    syncContact: syncContact.mutateAsync,
    registerActivity: registerActivity.mutateAsync,
    createDeal: createDeal.mutateAsync,
    sendNotification: sendNotification.mutateAsync,
    testConnection: testConnection.mutateAsync,
    
    // Loading states
    isSyncingContact: syncContact.isPending,
    isRegisteringActivity: registerActivity.isPending,
    isCreatingDeal: createDeal.isPending,
    isSendingNotification: sendNotification.isPending,
    isTestingConnection: testConnection.isPending,
  }), [
    status,
    config,
    updateConfig,
    contacts,
    activities,
    deals,
    syncContact,
    registerActivity,
    createDeal,
    sendNotification,
    testConnection,
  ]);
}
