import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Play a pleasant notification chime using Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant chime frequencies (C major chord arpeggio)
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = audioContext.currentTime;
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequencies[0], now);
    oscillator.frequency.setValueAtTime(frequencies[1], now + 0.1);
    oscillator.frequency.setValueAtTime(frequencies[2], now + 0.2);
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } catch (error) {
    console.log('Could not play notification sound:', error);
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
  const hasRequestedPermission = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, []);

  const showOpenNotification = useCallback(async (trackingId: string) => {
    const { data: email } = await supabase
      .from('tracked_emails')
      .select('recipient_email, subject, user_id')
      .eq('tracking_id', trackingId)
      .single();

    if (email && email.user_id === user?.id) {
      playNotificationSound();
      
      const title = '📧 Email Aberto!';
      const description = `${email.recipient_email} abriu "${email.subject || 'Sem assunto'}"`;
      
      toast({ title, description });
      showDesktopNotification(title, description);
    }
  }, [user, toast]);

  const showClickNotification = useCallback(async (trackingId: string, linkUrl: string) => {
    const { data: email } = await supabase
      .from('tracked_emails')
      .select('recipient_email, subject, user_id')
      .eq('tracking_id', trackingId)
      .single();

    if (email && email.user_id === user?.id) {
      playNotificationSound();
      
      const title = '🔗 Link Clicado!';
      const description = `${email.recipient_email} clicou em um link`;
      
      toast({ title, description });
      showDesktopNotification(title, description);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
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
          };
          
          if (event.event_type === 'open') {
            showOpenNotification(event.tracking_id);
          } else if (event.event_type === 'click') {
            showClickNotification(event.tracking_id, event.link_url || '');
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showOpenNotification, showClickNotification]);
}
