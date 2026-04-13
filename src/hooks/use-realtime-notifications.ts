import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { log } from '@/lib/logger';
import { playNotificationSound as playSound, NotificationSoundType } from '@/lib/notification-sound';

// Play notification using centralized sound system
function playNotificationChime(
  soundType?: NotificationSoundType, 
  volume?: number
) {
  try {
    playSound('success', soundType || 'gentle', volume || 0.5);
  } catch (error) {
    log.warn('Failed to play notification sound', { error });
  }
}

// Request browser notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Show desktop notification
function showDesktopNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'fuxico-notification',
    });
  }
}

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const hasRequestedPermission = useRef(false);

  // Request notification permission on mount if desktop notifications are enabled
  useEffect(() => {
    if (!hasRequestedPermission.current && preferences?.desktop_enabled) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, [preferences?.desktop_enabled]);

  const showOpenNotification = useCallback(async (trackingId: string, isSelfOpen: boolean) => {
    // Skip if self-open
    if (isSelfOpen) return;
    
    // Check if user wants open notifications
    if (!preferences?.notify_on_open) return;

    const { data: email } = await supabase
      .from('tracked_emails')
      .select('recipient_email, subject, user_id')
      .eq('tracking_id', trackingId)
      .single();

    if (email && email.user_id === user?.id) {
      // Play sound if enabled
      if (preferences?.sound_enabled) {
        playNotificationChime(
          preferences.notification_sound_type as NotificationSoundType,
          preferences.notification_volume || 0.5
        );
      }
      
      const title = '📧 Email Aberto!';
      const description = `${email.recipient_email} abriu "${email.subject || 'Sem assunto'}"`;
      
      toast({ title, description });
      
      // Show desktop notification if enabled
      if (preferences?.desktop_enabled) {
        showDesktopNotification(title, description);
      }
    }
  }, [user, toast, preferences]);

  const showClickNotification = useCallback(async (trackingId: string, _linkUrl: string) => {
    // Check if user wants click notifications
    if (!preferences?.notify_on_click) return;

    const { data: email } = await supabase
      .from('tracked_emails')
      .select('recipient_email, subject, user_id')
      .eq('tracking_id', trackingId)
      .single();

    if (email && email.user_id === user?.id) {
      // Play sound if enabled
      if (preferences?.sound_enabled) {
        playNotificationChime(
          preferences.notification_sound_type as NotificationSoundType,
          preferences.notification_volume || 0.5
        );
      }
      
      const title = '🔗 Link Clicado!';
      const description = `${email.recipient_email} clicou em um link`;
      
      toast({ title, description });
      
      // Show desktop notification if enabled
      if (preferences?.desktop_enabled) {
        showDesktopNotification(title, description);
      }
    }
  }, [user, toast, preferences]);

  const showFraudAlertNotification = useCallback((alert: {
    alert_type: string;
    severity: string;
    description: string;
    user_email: string;
  }) => {
    // Play urgent sound for fraud alerts
    if (preferences?.sound_enabled) {
      playNotificationChime(
        preferences.notification_sound_type as NotificationSoundType,
        preferences.critical_volume || 0.8
      );
    }
    
    const severityEmoji = alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️';
    const title = `${severityEmoji} Alerta de Fraude Detectado!`;
    const description = `${alert.user_email}: ${alert.description}`;
    
    toast({ 
      title, 
      description,
      variant: alert.severity === 'high' ? 'destructive' : 'default',
    });
    
    // Show desktop notification if enabled
    if (preferences?.desktop_enabled) {
      showDesktopNotification(title, description);
    }
  }, [toast, preferences]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to tracking events
    const trackingChannel = supabase
      .channel('tracking-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
        },
        (payload) => {
          const event = payload.new as { 
            tracking_id: string; 
            event_type: string;
            link_url?: string;
            is_self_open?: boolean;
          };
          
          if (event.event_type === 'open') {
            showOpenNotification(event.tracking_id, event.is_self_open || false);
          } else if (event.event_type === 'click') {
            showClickNotification(event.tracking_id, event.link_url || '');
          }
        }
      )
      .subscribe((status) => {
        log.debug('Tracking channel subscription status', { status });
      });

    // Subscribe to fraud alerts (for admins)
    const fraudChannel = supabase
      .channel('fraud-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_alerts',
        },
        (payload) => {
          const alert = payload.new as {
            alert_type: string;
            severity: string;
            description: string;
            user_email: string;
            user_id: string;
          };
          
          showFraudAlertNotification(alert);
        }
      )
      .subscribe((status) => {
        log.debug('Fraud alerts channel subscription status', { status });
      });

    return () => {
      supabase.removeChannel(trackingChannel);
      supabase.removeChannel(fraudChannel);
    };
  }, [user, showOpenNotification, showClickNotification, showFraudAlertNotification]);
}
