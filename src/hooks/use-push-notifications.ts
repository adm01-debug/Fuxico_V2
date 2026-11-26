import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Json } from '@/integrations/supabase/types';

export type { PushNotificationStats } from '@/lib/push-notification-stats';

export interface PushNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  icon: string | null;
  url: string | null;
  data: Json | null;
  sent_by: string | null;
  read_at: string | null;
  created_at: string;
}

export const PUSH_NOTIFICATIONS_QUERY_KEY = 'push-notifications';
const DEFAULT_LIMIT = 50;

const COLUMNS = 'id, user_id, title, body, icon, url, data, sent_by, read_at, created_at';

/** Lista as notificações do usuário logado (RLS: push_notifications_select_own). */
export function usePushNotifications(limit = DEFAULT_LIMIT) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [PUSH_NOTIFICATIONS_QUERY_KEY, user?.id, limit],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_notifications')
        .select(COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as PushNotification[];
    },
  });
}

interface SendPushNotificationInput {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/** Envia notificação via edge function send-push-notification (para o próprio usuário). */
export function useSendPushNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; notificationId: string },
    Error,
    SendPushNotificationInput
  >({
    mutationFn: async (input) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: input.title,
          body: input.body,
          ...(input.url ? { url: input.url } : {}),
          ...(input.icon ? { icon: input.icon } : {}),
        },
      });

      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(String((data as { error: unknown }).error));
      }

      return data as { success: boolean; notificationId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PUSH_NOTIFICATIONS_QUERY_KEY, user?.id] });
    },
  });
}

/** Marca uma notificação como lida (RLS: push_notifications_update_own). */
export function useMarkPushNotificationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('push_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PUSH_NOTIFICATIONS_QUERY_KEY, user?.id] });
    },
  });
}

/** Marca todas as notificações não lidas do usuário como lidas. */
export function useMarkAllPushNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase
        .from('push_notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PUSH_NOTIFICATIONS_QUERY_KEY, user?.id] });
    },
  });
}
