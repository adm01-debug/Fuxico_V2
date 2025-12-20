// =============================================================================
// FUXICO - Desktop Notifications Hook
// =============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface NotificationEvent {
  tracking_id: string;
  event_type: 'open' | 'click';
  created_at: string;
  metadata?: Record<string, unknown>;
}

export function useDesktopNotifications() {
  const { user } = useAuth();
  const permissionRef = useRef<NotificationPermission>('default');

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('[Notifications] Not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      permissionRef.current = permission;
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show desktop notification
  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if (permissionRef.current !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'fuxico-notification',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('[Notifications] Error showing notification:', error);
    }
  }, []);

  // Subscribe to realtime events
  useEffect(() => {
    if (!user?.id) return;

    // Request permission on mount
    requestPermission();

    console.log('[Notifications] Subscribing to realtime events for user:', user.id);

    const channel = supabase
      .channel('tracking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
        },
        async (payload) => {
          const event = payload.new as NotificationEvent;
          console.log('[Notifications] New tracking event:', event);

          // Skip self-opens
          if ((event as any).is_self_open) return;

          // Get email details
          const { data: emailData } = await supabase
            .from('tracked_emails')
            .select('recipient_email, subject, user_id')
            .eq('tracking_id', event.tracking_id)
            .maybeSingle();

          // Only notify if it's the current user's email
          if (!emailData || emailData.user_id !== user.id) return;

          const eventTypeLabel = event.event_type === 'open' ? '📧 Email Aberto' : '🔗 Link Clicado';
          const title = eventTypeLabel;
          const body = `${emailData.recipient_email}\n${emailData.subject || 'Sem assunto'}`;

          // Show toast
          toast({
            title: eventTypeLabel,
            description: `${emailData.recipient_email} - ${emailData.subject || 'Sem assunto'}`,
          });

          // Show desktop notification
          showNotification(title, body);
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Subscription status:', status);
      });

    return () => {
      console.log('[Notifications] Unsubscribing from realtime events');
      supabase.removeChannel(channel);
    };
  }, [user?.id, requestPermission, showNotification]);

  return {
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
    permission: permissionRef.current,
  };
}
