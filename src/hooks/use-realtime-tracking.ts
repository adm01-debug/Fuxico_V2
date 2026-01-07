// =============================================================================
// FUXICO - Hook para Tracking em Tempo Real
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface RealtimeStats {
  opens: number;
  clicks: number;
  bounces: number;
}

export interface RealtimeEvent {
  id: string;
  type: 'open' | 'click' | 'bounce';
  email: string;
  subject?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function useRealtimeTracking() {
  const [liveStats, setLiveStats] = useState<RealtimeStats>({ opens: 0, clicks: 0, bounces: 0 });
  const [liveEvents, setLiveEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const resetStats = useCallback(() => {
    setLiveStats({ opens: 0, clicks: 0, bounces: 0 });
  }, []);

  useEffect(() => {
    let mounted = true;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Canal para eventos de tracking
      const eventsChannel = supabase
        .channel('realtime-tracking-events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tracking_events',
          },
          async (payload) => {
            if (!mounted) return;

            // Buscar dados do email relacionado
            const { data: email } = await supabase
              .from('tracked_emails')
              .select('recipient_email, subject, user_id')
              .eq('tracking_id', payload.new.tracking_id)
              .single();

            // Só processar eventos do usuário atual
            if (!email || email.user_id !== user.id) return;

            const eventType = payload.new.event_type as 'open' | 'click';
            
            // Atualizar estatísticas
            setLiveStats((prev) => ({
              ...prev,
              [eventType === 'open' ? 'opens' : 'clicks']: prev[eventType === 'open' ? 'opens' : 'clicks'] + 1,
            }));

            // Adicionar novo evento
            const newEvent: RealtimeEvent = {
              id: payload.new.id,
              type: eventType,
              email: email.recipient_email,
              subject: email.subject || undefined,
              timestamp: payload.new.created_at,
            };

            setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
            setLastUpdate(new Date());

            // Invalidar cache para atualizar dados
            queryClient.invalidateQueries({ queryKey: ['tracking-stats'] });
          }
        )
        .subscribe((status) => {
          if (mounted) {
            setIsConnected(status === 'SUBSCRIBED');
          }
        });

      // Canal para bounces (atualizações em tracked_emails)
      const bouncesChannel = supabase
        .channel('realtime-tracking-bounces')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tracked_emails',
            filter: 'delivery_status=eq.bounced',
          },
          async (payload) => {
            if (!mounted) return;
            if (payload.new.user_id !== user.id) return;

            // Só contar se acabou de mudar para bounced
            if (payload.old?.delivery_status !== 'bounced' && payload.new.delivery_status === 'bounced') {
              setLiveStats((prev) => ({
                ...prev,
                bounces: prev.bounces + 1,
              }));

              const newEvent: RealtimeEvent = {
                id: payload.new.id,
                type: 'bounce',
                email: payload.new.recipient_email,
                subject: payload.new.subject || undefined,
                timestamp: payload.new.bounce_detected_at || new Date().toISOString(),
              };

              setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
              setLastUpdate(new Date());

              queryClient.invalidateQueries({ queryKey: ['tracking-stats'] });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(eventsChannel);
        supabase.removeChannel(bouncesChannel);
      };
    };

    const cleanup = setupRealtime();

    return () => {
      mounted = false;
      cleanup.then((fn) => fn?.());
    };
  }, [queryClient]);

  return {
    liveStats,
    liveEvents,
    isConnected,
    lastUpdate,
    resetStats,
  };
}
