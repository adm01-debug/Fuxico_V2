// =============================================================================
// FUXICO - Hook de Tracking Simplificado
// =============================================================================

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

// =============================================================================
// TIPOS
// =============================================================================

export interface TrackedEmail {
  id: string
  tracking_id: string
  recipient_email: string
  subject: string | null
  sender_email: string | null
  created_at: string
  metadata: Record<string, unknown> | null
  delivery_status: string | null
  bounce_type: string | null
  bounce_reason: string | null
  bounce_detected_at: string | null
  user_id: string | null
}

export interface TrackingFilters {
  search?: string
  deliveryStatus?: string
  dateFrom?: string
  dateTo?: string
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook principal para buscar emails rastreados
 */
export function useTrackedEmails(filters: TrackingFilters = {}) {
  return useQuery({
    queryKey: ['tracked-emails', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      let query = supabase
        .from('tracked_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (filters.deliveryStatus && filters.deliveryStatus !== 'all') {
        query = query.eq('delivery_status', filters.deliveryStatus)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      let filteredData = data || []
      
      // Apply text search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(email => 
          email.recipient_email?.toLowerCase().includes(searchLower) ||
          email.subject?.toLowerCase().includes(searchLower) ||
          email.sender_email?.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply date filters
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
      
      return filteredData
    },
    staleTime: 60 * 1000,
  })
}

/**
 * Hook para detalhes de um email específico
 */
export function useEmailDetail(trackingId: string) {
  return useQuery({
    queryKey: ['email-detail', trackingId],
    queryFn: async () => {
      // Get email
      const { data: email, error: emailError } = await supabase
        .from('tracked_emails')
        .select('*')
        .eq('tracking_id', trackingId)
        .single()
      
      if (emailError) throw emailError
      
      // Get events
      const { data: events } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('tracking_id', trackingId)
        .order('created_at', { ascending: false })
      
      // Get links
      const { data: links } = await supabase
        .from('tracked_links')
        .select('*')
        .eq('tracking_id', trackingId)
      
      const eventsList = events || []
      const linksList = links || []
      
      // Calculate stats
      const openEvents = eventsList.filter(e => e.event_type === 'open')
      const clickEvents = eventsList.filter(e => e.event_type === 'click')
      
      return {
        email,
        events: eventsList,
        links: linksList,
        stats: {
          totalOpens: openEvents.length,
          uniqueOpens: new Set(openEvents.map(e => e.ip_address)).size,
          selfOpens: openEvents.filter(e => e.is_self_open).length,
          totalClicks: clickEvents.length,
          uniqueClicks: new Set(clickEvents.map(e => e.ip_address)).size,
          firstOpened: openEvents.length > 0 ? openEvents[openEvents.length - 1].created_at : null,
          lastOpened: openEvents.length > 0 ? openEvents[0].created_at : null,
        }
      }
    },
    enabled: !!trackingId,
  })
}

/**
 * Hook para estatísticas gerais
 */
export function useTrackingStats() {
  return useQuery({
    queryKey: ['tracking-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data: emails } = await supabase
        .from('tracked_emails')
        .select('id, delivery_status')
        .eq('user_id', user.id)
      
      const { data: events } = await supabase
        .from('tracking_events')
        .select('event_type')
      
      const emailList = emails || []
      const eventList = events || []
      
      return {
        totalEmails: emailList.length,
        totalOpens: eventList.filter(e => e.event_type === 'open').length,
        totalClicks: eventList.filter(e => e.event_type === 'click').length,
        bounced: emailList.filter(e => e.delivery_status === 'bounced').length,
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook para invalidar cache
 */
export function useInvalidateTracking() {
  const queryClient = useQueryClient()
  
  return {
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-emails'] })
      queryClient.invalidateQueries({ queryKey: ['tracking-stats'] })
    }
  }
}
