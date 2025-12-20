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
 * Hook para métricas de engajamento detalhadas
 */
export function useEngagementMetrics() {
  return useQuery({
    queryKey: ['engagement-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Get all emails
      const { data: emails } = await supabase
        .from('tracked_emails')
        .select('id, tracking_id, recipient_email, subject, created_at, delivery_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      
      // Get all events
      const { data: events } = await supabase
        .from('tracking_events')
        .select('tracking_id, event_type, created_at, ip_address, user_agent, is_self_open')
        .order('created_at', { ascending: false })
      
      // Get all links
      const { data: links } = await supabase
        .from('tracked_links')
        .select('tracking_id, click_count, original_url')
      
      const emailList = emails || []
      const eventList = events || []
      const linkList = links || []
      
      // Calculate engagement per email
      const emailEngagement = emailList.map(email => {
        const emailEvents = eventList.filter(e => e.tracking_id === email.tracking_id)
        const emailLinks = linkList.filter(l => l.tracking_id === email.tracking_id)
        
        const opens = emailEvents.filter(e => e.event_type === 'open' && !e.is_self_open)
        const clicks = emailEvents.filter(e => e.event_type === 'click')
        
        const uniqueIps = new Set(opens.map(e => e.ip_address))
        const devices = opens.reduce((acc, event) => {
          const ua = event.user_agent?.toLowerCase() || ''
          if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            acc.mobile++
          } else {
            acc.desktop++
          }
          return acc
        }, { mobile: 0, desktop: 0 })
        
        const firstOpen = opens.length > 0 ? opens[opens.length - 1].created_at : null
        const timeToFirstOpen = firstOpen 
          ? Math.round((new Date(firstOpen).getTime() - new Date(email.created_at).getTime()) / 1000 / 60)
          : null
        
        return {
          id: email.id,
          trackingId: email.tracking_id,
          recipientEmail: email.recipient_email,
          subject: email.subject,
          createdAt: email.created_at,
          status: email.delivery_status,
          opens: opens.length,
          uniqueOpens: uniqueIps.size,
          clicks: clicks.length,
          linksTracked: emailLinks.length,
          totalLinkClicks: emailLinks.reduce((sum, l) => sum + (l.click_count || 0), 0),
          devices,
          timeToFirstOpen,
          engagementScore: calculateEngagementScore(opens.length, clicks.length, uniqueIps.size),
        }
      })
      
      // Overall metrics
      const totalEmails = emailList.length
      const emailsWithOpens = emailEngagement.filter(e => e.opens > 0).length
      const emailsWithClicks = emailEngagement.filter(e => e.clicks > 0).length
      const avgOpensPerEmail = totalEmails > 0 
        ? Math.round((emailEngagement.reduce((sum, e) => sum + e.opens, 0) / totalEmails) * 10) / 10
        : 0
      const avgClicksPerEmail = totalEmails > 0
        ? Math.round((emailEngagement.reduce((sum, e) => sum + e.clicks, 0) / totalEmails) * 10) / 10
        : 0
      const avgTimeToOpen = emailEngagement.filter(e => e.timeToFirstOpen !== null).length > 0
        ? Math.round(
            emailEngagement
              .filter(e => e.timeToFirstOpen !== null)
              .reduce((sum, e) => sum + (e.timeToFirstOpen || 0), 0) / 
            emailEngagement.filter(e => e.timeToFirstOpen !== null).length
          )
        : null
      
      // Device breakdown
      const totalMobile = emailEngagement.reduce((sum, e) => sum + e.devices.mobile, 0)
      const totalDesktop = emailEngagement.reduce((sum, e) => sum + e.devices.desktop, 0)
      
      // Top performing emails
      const topEmails = [...emailEngagement]
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 5)
      
      return {
        emails: emailEngagement,
        summary: {
          totalEmails,
          emailsWithOpens,
          emailsWithClicks,
          openRate: totalEmails > 0 ? Math.round((emailsWithOpens / totalEmails) * 100) : 0,
          clickRate: emailsWithOpens > 0 ? Math.round((emailsWithClicks / emailsWithOpens) * 100) : 0,
          avgOpensPerEmail,
          avgClicksPerEmail,
          avgTimeToOpen,
        },
        devices: {
          mobile: totalMobile,
          desktop: totalDesktop,
          mobilePercentage: (totalMobile + totalDesktop) > 0 
            ? Math.round((totalMobile / (totalMobile + totalDesktop)) * 100) 
            : 0,
        },
        topEmails,
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

function calculateEngagementScore(opens: number, clicks: number, uniqueOpens: number): number {
  // Simple engagement score: opens * 1 + clicks * 3 + uniqueOpens * 2
  return opens + (clicks * 3) + (uniqueOpens * 2)
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
      queryClient.invalidateQueries({ queryKey: ['engagement-metrics'] })
    }
  }
}
