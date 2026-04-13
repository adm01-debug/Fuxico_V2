/** Hook para lembretes de follow-up */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FollowUpReminder {
  id: string;
  user_id: string;
  tracking_id: string;
  reminder_days: number;
  status: 'pending' | 'sent' | 'cancelled' | 'opened';
  reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReminderWithEmail extends FollowUpReminder {
  recipient_email: string;
  subject: string;
  email_created_at: string;
  days_since_sent: number;
}

export function useFollowUpReminders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follow-up-reminders', user?.id],
    queryFn: async (): Promise<ReminderWithEmail[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select(`
          *,
          tracked_emails!inner(recipient_email, subject, created_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      interface ReminderQueryResult {
        id: string;
        user_id: string;
        tracking_id: string;
        reminder_days: number;
        status: string;
        reminded_at: string | null;
        created_at: string;
        updated_at: string;
        tracked_emails: {
          recipient_email: string;
          subject: string | null;
          created_at: string;
        };
      }
      
      return (data || []).map((item: ReminderQueryResult) => ({
        ...item,
        recipient_email: item.tracked_emails.recipient_email,
        subject: item.tracked_emails.subject || '',
        email_created_at: item.tracked_emails.created_at,
        days_since_sent: Math.floor(
          (Date.now() - new Date(item.tracked_emails.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));
    },
    enabled: !!user?.id,
  });
}

export function usePendingReminders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-reminders', user?.id],
    queryFn: async (): Promise<ReminderWithEmail[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select(`
          *,
          tracked_emails!inner(recipient_email, subject, created_at)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      interface ReminderQueryResult2 {
        id: string;
        user_id: string;
        tracking_id: string;
        reminder_days: number;
        status: string;
        reminded_at: string | null;
        created_at: string;
        updated_at: string;
        tracked_emails: {
          recipient_email: string;
          subject: string | null;
          created_at: string;
        };
      }
      
      return (data || []).map((item: ReminderQueryResult2) => {
        const daysSinceSent = Math.floor(
          (Date.now() - new Date(item.tracked_emails.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          ...item,
          recipient_email: item.tracked_emails.recipient_email,
          subject: item.tracked_emails.subject || '',
          email_created_at: item.tracked_emails.created_at,
          days_since_sent: daysSinceSent,
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useDueReminders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['due-reminders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('get_due_reminders');

      if (error) throw error;

      return (data || []).filter((r) => r.user_id === user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ trackingId, reminderDays }: { trackingId: string; reminderDays: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('follow_up_reminders')
        .insert({
          user_id: user.id,
          tracking_id: trackingId,
          reminder_days: reminderDays,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reminders'] });
    },
  });
}

export function useUpdateReminderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'sent' | 'cancelled' | 'opened' }) => {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .update({ 
          status,
          reminded_at: status === 'sent' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['due-reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('follow_up_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reminders'] });
    },
  });
}
