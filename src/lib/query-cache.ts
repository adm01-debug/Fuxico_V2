import { log } from './logger';
// =============================================================================
// FUXICO - React Query Cache Utilities
// Arquivo: src/lib/query-cache.ts
// Descrição: Utilitários para otimização de cache do React Query
// =============================================================================

import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

// =============================================================================
// CONFIGURAÇÃO OTIMIZADA
// =============================================================================

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Tempo que os dados são considerados "frescos" (não refetch automático)
      staleTime: 1000 * 60 * 2, // 2 minutos
      
      // Tempo que dados ficam em cache após não serem usados
      gcTime: 1000 * 60 * 30, // 30 minutos (antigo cacheTime)
      
      // Não refetch ao focar a janela por padrão
      refetchOnWindowFocus: false,
      
      // Refetch ao reconectar
      refetchOnReconnect: true,
      
      // Retry apenas 1 vez em caso de erro
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Manter dados anteriores enquanto carrega novos
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Retry apenas para erros de rede
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        if (error instanceof Error && error.message.includes('network')) return true;
        return false;
      },
    },
  },
};

// =============================================================================
// QUERY CLIENT SINGLETON
// =============================================================================

let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient(queryClientConfig);
  }
  return queryClientInstance;
}

// =============================================================================
// CACHE KEYS CENTRALIZADAS
// =============================================================================

export const QUERY_KEYS = {
  // Tracking
  trackedEmails: (filters?: Record<string, unknown>) => 
    ['tracked-emails', filters] as const,
  emailDetail: (trackingId: string) => 
    ['email-detail', trackingId] as const,
  trackingStats: () => 
    ['tracking-stats'] as const,
  trackingTrends: (days: number) => 
    ['tracking-trends', days] as const,
  engagementMetrics: () => 
    ['engagement-metrics'] as const,
  
  // Links
  trackedLinks: () => 
    ['tracked-links'] as const,
  standaloneLinks: () => 
    ['standalone-links'] as const,
  
  // Documents
  trackedDocuments: () => 
    ['tracked-documents'] as const,
  documentEvents: (documentId: string) => 
    ['document-events', documentId] as const,
  
  // CRM
  crmConfig: (provider?: string) => 
    ['crm', 'config', provider] as const,
  crmContacts: (provider?: string) => 
    ['crm', 'contacts', provider] as const,
  crmActivities: (provider?: string) => 
    ['crm', 'activities', provider] as const,
  crmDeals: (provider?: string) => 
    ['crm', 'deals', provider] as const,
  
  // Webhooks
  webhookConfig: () => 
    ['webhook-config'] as const,
  webhookLogs: (limit?: number) => 
    ['webhook-logs', limit] as const,
  
  // Audit
  auditLogs: () => 
    ['audit-logs'] as const,
  auditConfig: () => 
    ['audit-config'] as const,
  
  // User
  userPreferences: () => 
    ['user-preferences'] as const,
  userRoles: () => 
    ['user-roles'] as const,
} as const;

// =============================================================================
// INVALIDAÇÃO INTELIGENTE
// =============================================================================

interface InvalidationGroup {
  keys: readonly (readonly unknown[])[];
  exact?: boolean;
}

const INVALIDATION_GROUPS: Record<string, InvalidationGroup> = {
  // Quando um email é rastreado
  emailTracked: {
    keys: [
      QUERY_KEYS.trackingStats(),
      QUERY_KEYS.trackingTrends(7),
      QUERY_KEYS.engagementMetrics(),
    ],
    exact: false,
  },
  
  // Quando há evento de abertura/clique
  trackingEvent: {
    keys: [
      QUERY_KEYS.trackingStats(),
      QUERY_KEYS.trackingTrends(7),
      QUERY_KEYS.engagementMetrics(),
    ],
    exact: false,
  },
  
  // Quando configuração CRM muda
  crmConfigChange: {
    keys: [
      ['crm'],
    ],
    exact: false,
  },
  
  // Refresh completo de tracking
  trackingRefresh: {
    keys: [
      ['tracked-emails'],
      ['tracking-stats'],
      ['tracking-trends'],
      ['engagement-metrics'],
    ],
    exact: false,
  },
};

export function invalidateGroup(
  queryClient: QueryClient, 
  groupName: keyof typeof INVALIDATION_GROUPS
): void {
  const group = INVALIDATION_GROUPS[groupName];
  if (!group) return;
  
  group.keys.forEach((key) => {
    queryClient.invalidateQueries({
      queryKey: key as unknown[],
      exact: group.exact,
    });
  });
}

// =============================================================================
// PREFETCH HELPERS
// =============================================================================

export async function prefetchDashboardData(queryClient: QueryClient): Promise<void> {
  const prefetchPromises = [
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.trackingStats(),
      staleTime: 1000 * 60 * 5,
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.trackingTrends(7),
      staleTime: 1000 * 60 * 5,
    }),
  ];
  
  await Promise.allSettled(prefetchPromises);
}

// =============================================================================
// OPTIMISTIC UPDATE HELPERS
// =============================================================================

export function createOptimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
): { previousData: T | undefined; rollback: () => void } {
  // Cancel outgoing refetches
  queryClient.cancelQueries({ queryKey: queryKey as unknown[] });
  
  // Snapshot previous value
  const previousData = queryClient.getQueryData<T>(queryKey as unknown[]);
  
  // Optimistically update
  queryClient.setQueryData(queryKey as unknown[], updater(previousData));
  
  // Return rollback function
  return {
    previousData,
    rollback: () => {
      queryClient.setQueryData(queryKey as unknown[], previousData);
    },
  };
}

// =============================================================================
// CACHE PERSISTENCE (PARA OFFLINE)
// =============================================================================

const CACHE_STORAGE_KEY = 'fuxico-query-cache';
const CACHE_VERSION = 1;

interface PersistedCache {
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
}

export function persistQueryCache(queryClient: QueryClient): void {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  const persistedData: Record<string, unknown> = {};
  
  queries.forEach((query) => {
    // Só persistir queries importantes
    const keyString = JSON.stringify(query.queryKey);
    if (
      keyString.includes('tracking-stats') ||
      keyString.includes('tracked-emails') ||
      keyString.includes('user-preferences')
    ) {
      if (query.state.data) {
        persistedData[keyString] = {
          data: query.state.data,
          dataUpdatedAt: query.state.dataUpdatedAt,
        };
      }
    }
  });
  
  const persistedCache: PersistedCache = {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    data: persistedData,
  };
  
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(persistedCache));
  } catch (error) {
    log.error('[QueryCache] Failed to persist cache', error);
  }
}

export function restoreQueryCache(queryClient: QueryClient): void {
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!stored) return;
    
    const persistedCache: PersistedCache = JSON.parse(stored);
    
    // Verificar versão e idade (máx 24h)
    if (persistedCache.version !== CACHE_VERSION) return;
    if (Date.now() - persistedCache.timestamp > 24 * 60 * 60 * 1000) return;
    
    Object.entries(persistedCache.data).forEach(([keyString, value]) => {
      const queryKey = JSON.parse(keyString);
      const { data, dataUpdatedAt } = value as { data: unknown; dataUpdatedAt: number };
      
      queryClient.setQueryData(queryKey, data, {
        updatedAt: dataUpdatedAt,
      });
    });
    
    log.debug('[QueryCache] Restored cache from localStorage');
  } catch (error) {
    log.error('[QueryCache] Failed to restore cache', error);
  }
}

export function clearPersistedCache(): void {
  localStorage.removeItem(CACHE_STORAGE_KEY);
}

// =============================================================================
// HOOKS DE SINCRONIZAÇÃO
// =============================================================================

export function setupCacheSync(queryClient: QueryClient): () => void {
  // Persistir cache ao sair
  const handleBeforeUnload = () => {
    persistQueryCache(queryClient);
  };
  
  // Restaurar ao ficar online
  const handleOnline = () => {
    // Invalidar queries stale quando voltar online
    queryClient.invalidateQueries({
      predicate: (query) => query.isStale(),
    });
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('online', handleOnline);
  
  // Restaurar cache ao iniciar
  restoreQueryCache(queryClient);
  
  // Cleanup
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('online', handleOnline);
  };
}
