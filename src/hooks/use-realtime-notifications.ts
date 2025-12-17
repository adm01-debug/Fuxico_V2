import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Play a pleasant notification chime using Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for the chime
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

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();

  const showNotification = useCallback(async (trackingId: string) => {
    const { data: email } = await supabase
      .from('tracked_emails')
      .select('recipient_email, subject, user_id')
      .eq('tracking_id', trackingId)
      .single();

    if (email && email.user_id === user?.id) {
      playNotificationSound();
      toast({
        title: '📧 Email Aberto!',
        description: `${email.recipient_email} abriu "${email.subject || 'Sem assunto'}"`,
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tracking-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
          filter: `event_type=eq.open`
        },
        (payload) => {
          const event = payload.new as { tracking_id: string };
          showNotification(event.tracking_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showNotification]);
}
