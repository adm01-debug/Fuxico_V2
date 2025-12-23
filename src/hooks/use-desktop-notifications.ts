// =============================================================================
// FUXICO - Desktop Notifications Hook
// =============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { playNotificationSound, NotificationSoundType } from '@/lib/notification-sound';
import { useUserPreferences } from '@/hooks/use-user-preferences';

interface NotificationEvent {
  tracking_id: string;
  event_type: 'open' | 'click';
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface BounceAlertEvent {
  id: string;
  user_id: string;
  domain: string;
  bounce_rate: number;
  threshold: number;
  alert_type: string;
  created_at: string;
}

export function useDesktopNotifications() {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
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
  const showNotification = useCallback((title: string, body: string, options?: { icon?: string; tag?: string }) => {
    if (permissionRef.current !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: options?.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: options?.tag || 'fuxico-notification',
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

  // Subscribe to tracking events
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
        console.log('[Notifications] Tracking subscription status:', status);
      });

    return () => {
      console.log('[Notifications] Unsubscribing from tracking events');
      supabase.removeChannel(channel);
    };
  }, [user?.id, requestPermission, showNotification]);

  // Subscribe to bounce alerts
  useEffect(() => {
    if (!user?.id) return;

    console.log('[Notifications] Subscribing to bounce alerts for user:', user.id);

    const bounceChannel = supabase
      .channel('bounce-alert-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bounce_alerts',
        },
        (payload) => {
          const alert = payload.new as BounceAlertEvent;
          console.log('[Notifications] New bounce alert:', alert);

          // Only notify if it's the current user's alert
          if (alert.user_id !== user.id) return;

          const isCritical = alert.alert_type === 'critical_bounce_rate';
          const emoji = isCritical ? '🚨' : '⚠️';
          const severity = isCritical ? 'CRÍTICO' : 'Aviso';
          const title = `${emoji} Alerta de Bounce ${severity}`;
          const body = `Domínio: ${alert.domain}\nTaxa de bounce: ${alert.bounce_rate.toFixed(1)}% (limite: ${alert.threshold}%)`;

          // Play notification sound if enabled
          if (preferences?.sound_enabled !== false) {
            const soundType = (preferences?.notification_sound_type ?? 'gentle') as NotificationSoundType;
            const volume = preferences?.notification_volume ?? 0.5;
            playNotificationSound(isCritical ? 'critical' : 'warning', soundType, volume);
          }

          // Show toast with appropriate variant
          toast({
            title,
            description: `${alert.domain} - Taxa de bounce: ${alert.bounce_rate.toFixed(1)}%`,
            variant: isCritical ? 'destructive' : 'default',
          });

          // Show desktop notification
          showNotification(title, body, { 
            tag: `bounce-alert-${alert.id}`,
          });
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Bounce alerts subscription status:', status);
      });

    return () => {
      console.log('[Notifications] Unsubscribing from bounce alerts');
      supabase.removeChannel(bounceChannel);
    };
  }, [user?.id, showNotification]);

  return {
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
    permission: permissionRef.current,
  };
}
