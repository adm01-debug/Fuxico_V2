// =============================================================================
// FUXICO - Hook de Tracking Otimizado
// Arquivo: src/hooks/use-tracking.ts
// Descrição: Hook para buscar emails rastreados com cache e paginação otimizada
// =============================================================================

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// =============================================================================
// TIPOS
// =============================================================================

export interface TrackedEmail {
  id: string
  tracking_id: string
  recipient_email: string
  subject: string
  sender_email: string
  created_at: string
  metadata: Record<string, unknown>
  delivery_status: 'pending' | 'delivered' | 'bounced' | 'failed'
  bounce_type: string | null
  bounce_reason: string | null
  bounce_detected_at: string | null
  // Stats agregadas
  opens: number
  clicks: number
  self_opens: number
  unique_opens: number
  first_opened_at: string | null
  last_opened_at: string | null
}

export interface TrackingFilters {
  search?: string
  deliveryStatus?: string
  dateFrom?: string
  dateTo?: string
}

interface PageInfo {
  limit: number
  offset: number
  has_more: boolean
  next_cursor?: string
}

interface TrackingResponse {
  success: boolean
  data: TrackedEmail[]
  pagination: PageInfo
}

// =============================================================================
// CONSTANTES
// =============================================================================

const QUERY_KEYS = {
  emails: 'tracked-emails',
  emailsInfinite: 'tracked-emails-infinite',
  stats: 'tracking-stats',
} as const

const DEFAULT_LIMIT = 50

// Cache configurações otimizadas
const CACHE_CONFIG = {
  // Dados são considerados frescos por 1 minuto
  staleTime: 60 * 1000,
  // Manter em cache por 5 minutos
  gcTime: 5 * 60 * 1000,
  // Retry com backoff exponencial
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
}

// =============================================================================
// FUNÇÕES DE API
// =============================================================================

/**
 * Busca emails rastreados com paginação simples (offset-based)
 * Usa a RPC otimizada que resolve o N+1
 */
async function fetchTrackedEmails(
  userId: string,
  filters: TrackingFilters = {},
  limit = DEFAULT_LIMIT,
  offset = 0
): Promise<TrackingResponse> {
  const endTimer = logger.time('fetchTrackedEmails')
  
  try {
    const { data, error } = await supabase
      .rpc('get_emails_with_stats', {
        p_user_id: userId,
        p_limit: limit + 1, // +1 para detectar se há mais
        p_offset: offset,
        p_delivery_status: filters.deliveryStatus || null,
      })
    
    if (error) {
      logger.error('Failed to fetch tracked emails', error)
      throw error
    }
    
    // Aplicar filtros de busca no frontend (para search por texto)
    let filteredData = data || []
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter(email => 
        email.recipient_email?.toLowerCase().includes(searchLower) ||
        email.subject?.toLowerCase().includes(searchLower) ||
        email.sender_email?.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filteredData = filteredData.filter(email => 
        new Date(email.created_at) >= fromDate
      )
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      filteredData = filteredData.filter(email => 
        new Date(email.created_at) <= toDate
      )
    }
    
    const hasMore = filteredData.length > limit
    const results = hasMore ? filteredData.slice(0, limit) : filteredData
    
    return {
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        has_more: hasMore,
        next_cursor: hasMore && results.length > 0 
          ? results[results.length - 1].created_at 
          : undefined,
      },
    }
  } finally {
    endTimer()
  }
}

/**
 * Busca emails com paginação cursor-based (para infinite scroll)
 */
async function fetchTrackedEmailsCursor(
  userId: string,
  filters: TrackingFilters = {},
  limit = DEFAULT_LIMIT,
  cursor?: string
): Promise<TrackingResponse> {
  const endTimer = logger.time('fetchTrackedEmailsCursor')
  
  try {
    const { data, error } = await supabase
      .rpc('get_emails_with_stats', {
        p_user_id: userId,
        p_limit: limit + 1,
        p_offset: 0,
        p_cursor_date: cursor || null,
        p_delivery_status: filters.deliveryStatus || null,
      })
    
    if (error) {
      logger.error('Failed to fetch emails with cursor', error)
      throw error
    }
    
    const hasMore = data && data.length > limit
    const results = hasMore ? data.slice(0, limit) : (data || [])
    
    return {
      success: true,
      data: results,
      pagination: {
        limit,
        offset: 0,
        has_more: hasMore,
        next_cursor: hasMore && results.length > 0 
          ? results[results.length - 1].created_at 
          : undefined,
      },
    }
  } finally {
    endTimer()
  }
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook principal para buscar emails rastreados
 * Com paginação simples e cache otimizado
 */
export function useTrackedEmails(
  filters: TrackingFilters = {},
  page = 0,
  limit = DEFAULT_LIMIT
) {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: [QUERY_KEYS.emails, filters, page, limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      return fetchTrackedEmails(user.id, filters, limit, page * limit)
    },
    ...CACHE_CONFIG,
    // Prefetch da próxima página
    meta: {
      onSuccess: (data: TrackingResponse) => {
        if (data.pagination.has_more) {
          queryClient.prefetchQuery({
            queryKey: [QUERY_KEYS.emails, filters, page + 1, limit],
            queryFn: async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('User not authenticated')
              return fetchTrackedEmails(user.id, filters, limit, (page + 1) * limit)
            },
          })
        }
      },
    },
  })
}

/**
 * Hook com infinite scroll (paginação cursor-based)
 * Mais eficiente para grandes datasets
 */
export function useTrackedEmailsInfinite(
  filters: TrackingFilters = {},
  limit = DEFAULT_LIMIT
) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.emailsInfinite, filters],
    queryFn: async ({ pageParam }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      return fetchTrackedEmailsCursor(user.id, filters, limit, pageParam)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.next_cursor,
    ...CACHE_CONFIG,
  })
}

/**
 * Hook para estatísticas gerais de tracking
 */
export function useTrackingStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('email_stats_mv')
        .select('opens, clicks, unique_opens, delivery_status')
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Agregar estatísticas
      const stats = (data || []).reduce(
        (acc, email) => ({
          totalEmails: acc.totalEmails + 1,
          totalOpens: acc.totalOpens + (email.opens || 0),
          totalClicks: acc.totalClicks + (email.clicks || 0),
          uniqueOpens: acc.uniqueOpens + (email.unique_opens || 0),
          bounced: acc.bounced + (email.delivery_status === 'bounced' ? 1 : 0),
        }),
        { totalEmails: 0, totalOpens: 0, totalClicks: 0, uniqueOpens: 0, bounced: 0 }
      )
      
      return stats
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

/**
 * Hook para invalidar cache após ações
 */
export function useInvalidateTracking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.emails] })
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.emailsInfinite] })
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] })
    },
  })
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Formata email para display
 */
export function formatEmailDisplay(email: TrackedEmail): {
  title: string
  subtitle: string
  status: 'read' | 'unread' | 'bounced'
} {
  return {
    title: email.subject || '(Sem assunto)',
    subtitle: email.recipient_email,
    status: email.delivery_status === 'bounced' 
      ? 'bounced' 
      : email.opens > 0 
        ? 'read' 
        : 'unread',
  }
}

/**
 * Calcula taxa de abertura
 */
export function calculateOpenRate(email: TrackedEmail): number {
  if (email.delivery_status === 'bounced') return 0
  return email.opens > 0 ? 100 : 0
}
