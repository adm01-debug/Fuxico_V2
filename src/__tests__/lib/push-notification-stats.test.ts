import { describe, expect, it } from 'vitest';
import { computePushNotificationStats } from '@/lib/push-notification-stats';

const now = new Date('2026-11-26T15:00:00.000Z');

function notification(createdAt: string, readAt: string | null = null) {
  return { created_at: createdAt, read_at: readAt };
}

describe('computePushNotificationStats', () => {
  it('devolve zeros quando não há notificações', () => {
    expect(computePushNotificationStats([], now)).toEqual({
      total: 0,
      unread: 0,
      today: 0,
      lastAt: null,
    });
  });

  it('conta não lidas (read_at nulo)', () => {
    const stats = computePushNotificationStats(
      [
        notification('2026-11-26T14:00:00.000Z'),
        notification('2026-11-26T13:00:00.000Z', '2026-11-26T13:30:00.000Z'),
        notification('2026-11-25T10:00:00.000Z'),
      ],
      now
    );

    expect(stats.total).toBe(3);
    expect(stats.unread).toBe(2);
  });

  it('usa a data local para separar as de hoje', () => {
    const stats = computePushNotificationStats(
      [
        notification(new Date(2026, 10, 26, 9, 0).toISOString()),
        notification(new Date(2026, 10, 25, 23, 30).toISOString()),
        notification(new Date(2026, 10, 20, 12, 0).toISOString()),
      ],
      new Date(2026, 10, 26, 15, 0)
    );

    expect(stats.today).toBe(1);
  });

  it('devolve a data da notificação mais recente como lastAt', () => {
    const newest = '2026-11-26T14:00:00.000Z';
    const stats = computePushNotificationStats(
      [notification(newest), notification('2026-11-25T10:00:00.000Z')],
      now
    );

    expect(stats.lastAt).toBe(newest);
  });

  it('ignora data inválida na contagem de hoje', () => {
    const stats = computePushNotificationStats(
      [notification('data-invalida'), notification('2026-11-26T14:00:00.000Z')],
      now
    );

    expect(stats.today).toBe(1);
    expect(stats.total).toBe(2);
  });
});
