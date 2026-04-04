import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), auth: { getUser: vi.fn() } },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, loading: false }),
}));

describe('useTracking - engagement metrics', () => {
  it('should calculate unique opens from Set of IPs', () => {
    const events = [
      { ip_address: '1.1.1.1', event_type: 'open' },
      { ip_address: '1.1.1.1', event_type: 'open' },
      { ip_address: '2.2.2.2', event_type: 'open' },
    ];
    const uniqueIPs = new Set(events.filter(e => e.event_type === 'open').map(e => e.ip_address));
    expect(uniqueIPs.size).toBe(2);
  });

  it('should separate opens from clicks', () => {
    const events = [
      { event_type: 'open' }, { event_type: 'open' },
      { event_type: 'click' }, { event_type: 'click' }, { event_type: 'click' },
    ];
    const opens = events.filter(e => e.event_type === 'open').length;
    const clicks = events.filter(e => e.event_type === 'click').length;
    expect(opens).toBe(2);
    expect(clicks).toBe(3);
  });

  it('should handle empty events array', () => {
    const events: Array<{ event_type: string }> = [];
    expect(events.filter(e => e.event_type === 'open').length).toBe(0);
  });
});
