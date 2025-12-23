import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactEmail {
  id: string;
  tracking_id: string;
  subject: string | null;
  created_at: string;
  delivery_status: string | null;
  open_count: number | null;
  click_count: number | null;
}

export interface ContactEvent {
  id: string;
  tracking_id: string;
  event_type: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  link_url: string | null;
  is_self_open: boolean | null;
}

export interface ContactHistoryItem {
  id: string;
  type: 'email_sent' | 'email_open' | 'link_click' | 'bounce';
  timestamp: string;
  subject?: string | null;
  tracking_id: string;
  link_url?: string | null;
  ip_address?: string | null;
  is_self_open?: boolean | null;
}

export function useContactHistory(email: string | null) {
  return useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['contact-history', email],
    queryFn: async () => {
      if (!email) return { emails: [], events: [], timeline: [] };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all emails sent to this contact
      const { data: emails, error: emailsError } = await supabase
        .from('email_stats_mv')
        .select('id, tracking_id, subject, created_at, delivery_status, open_count, click_count')
        .eq('user_id', user.id)
        .eq('recipient_email', email)
        .order('created_at', { ascending: false });

      if (emailsError) throw emailsError;

      const trackingIds = emails?.map(e => e.tracking_id) || [];

      // Fetch all events for these emails
      let events: ContactEvent[] = [];
      if (trackingIds.length > 0) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('tracking_events')
          .select('id, tracking_id, event_type, created_at, ip_address, user_agent, link_url, is_self_open')
          .in('tracking_id', trackingIds)
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;
        events = eventsData || [];
      }

      // Build timeline
      const timeline: ContactHistoryItem[] = [];

      // Add email sent events
      emails?.forEach(email => {
        timeline.push({
          id: `sent-${email.id}`,
          type: 'email_sent',
          timestamp: email.created_at,
          subject: email.subject,
          tracking_id: email.tracking_id,
        });

        // Add bounce event if bounced
        if (email.delivery_status === 'bounced') {
          timeline.push({
            id: `bounce-${email.id}`,
            type: 'bounce',
            timestamp: email.created_at,
            subject: email.subject,
            tracking_id: email.tracking_id,
          });
        }
      });

      // Add open/click events
      events.forEach(event => {
        const email = emails?.find(e => e.tracking_id === event.tracking_id);
        timeline.push({
          id: event.id,
          type: event.event_type === 'open' ? 'email_open' : 'link_click',
          timestamp: event.created_at,
          subject: email?.subject,
          tracking_id: event.tracking_id,
          link_url: event.link_url,
          ip_address: event.ip_address,
          is_self_open: event.is_self_open,
        });
      });

      // Sort by timestamp descending
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        emails: emails || [],
        events,
        timeline,
      };
    },
    enabled: !!email,
  });
}
