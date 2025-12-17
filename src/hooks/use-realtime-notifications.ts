import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();

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
        async (payload) => {
          const event = payload.new as {
            tracking_id: string;
            created_at: string;
            ip_address?: string;
          };

          // Fetch email details to check if it belongs to current user
          const { data: email } = await supabase
            .from('tracked_emails')
            .select('recipient_email, subject, user_id')
            .eq('tracking_id', event.tracking_id)
            .single();

          if (email && email.user_id === user.id) {
            toast({
              title: '📧 Email Aberto!',
              description: `${email.recipient_email} abriu "${email.subject || 'Sem assunto'}"`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
}
