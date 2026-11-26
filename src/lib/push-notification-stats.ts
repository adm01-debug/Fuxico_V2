/**
 * Estatísticas das notificações push da conta.
 * Função pura para poder ser testada sem depender do Supabase.
 */

export interface PushNotificationLike {
  created_at: string;
  read_at: string | null;
}

export interface PushNotificationStats {
  total: number;
  unread: number;
  today: number;
  lastAt: string | null;
}

export function computePushNotificationStats(
  items: PushNotificationLike[],
  now: Date = new Date()
): PushNotificationStats {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  return {
    total: items.length,
    unread: items.filter((item) => !item.read_at).length,
    today: items.filter((item) => {
      const createdAt = new Date(item.created_at);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= startOfToday;
    }).length,
    lastAt: items.length > 0 ? items[0].created_at : null,
  };
}
