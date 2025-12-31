import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Shield, Activity } from 'lucide-react';

interface RealtimeAlert {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  created_at: string;
}

export function useSecurityRealtimeAlerts() {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);

  useEffect(() => {
    // Subscribe to security events
    const channel = supabase
      .channel('security-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload) => {
          const event = payload.new as RealtimeAlert;
          
          // Show toast for important events
          if (event.severity === 'error' || event.severity === 'critical') {
            toast.error(event.description, {
              duration: 10000,
              icon: <AlertTriangle className="w-5 h-5" />,
            });
          } else if (event.severity === 'warning') {
            toast.warning(event.description, {
              duration: 5000,
              icon: <Shield className="w-5 h-5" />,
            });
          }

          setAlerts((prev) => [event, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    // Subscribe to rate limit logs for blocked requests
    const rateLimitChannel = supabase
      .channel('rate-limit-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rate_limit_logs',
          filter: 'is_blocked=eq.true',
        },
        (payload) => {
          const log = payload.new as { ip_address: string; endpoint: string };
          
          toast.warning(`IP ${log.ip_address} bloqueado em ${log.endpoint}`, {
            duration: 5000,
            icon: <Activity className="w-5 h-5" />,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(rateLimitChannel);
    };
  }, []);

  return { alerts };
}

export default function RateLimitRealtimeAlerts() {
  const { alerts } = useSecurityRealtimeAlerts();

  // This component can be used as a provider or standalone
  // The alerts are shown via toast, so no UI is needed here
  return null;
}
