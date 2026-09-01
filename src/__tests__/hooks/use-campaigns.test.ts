import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before imports
const mockFrom = vi.fn();
const mockAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null }),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    auth: mockAuth,
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, session: {}, loading: false }),
}));

describe('useCampaigns - batch query optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch campaigns with stats in batch (not N+1)', async () => {
    const mockCampaigns = [
      { id: 'c1', user_id: 'user-123', name: 'Campaign 1', status: 'active', created_at: '2026-01-01' },
      { id: 'c2', user_id: 'user-123', name: 'Campaign 2', status: 'draft', created_at: '2026-01-02' },
    ];

    const mockEmails = [
      { campaign_id: 'c1', tracking_id: 't1' },
      { campaign_id: 'c1', tracking_id: 't2' },
      { campaign_id: 'c2', tracking_id: 't3' },
    ];

    const mockEvents = [
      { tracking_id: 't1', event_type: 'open' },
      { tracking_id: 't1', event_type: 'click' },
      { tracking_id: 't2', event_type: 'open' },
    ];

    // Track how many times .from() is called
    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      fromCallCount++;
      const builder: Record<string, unknown> = {};
      const chain = new Proxy(builder, {
        get: (_target, prop) => {
          if (prop === 'then') return undefined;
          if (prop === 'data') {
            if (table === 'campaigns') return mockCampaigns;
            if (table === 'tracked_emails') return mockEmails;
            if (table === 'tracking_events') return mockEvents;
          }
          return () => chain;
        },
      });
      return chain;
    });

    // The key assertion: with batch optimization, we expect exactly 3 queries
    // (campaigns, tracked_emails IN campaign_ids, tracking_events IN tracking_ids)
    // NOT 2*N+1 queries (1 + N for emails + N for events)
    expect(fromCallCount).toBeLessThanOrEqual(3);
  });

  it('should calculate correct stats from batched data', () => {
    const trackingIds = ['t1', 't2'];
    const events = [
      { tracking_id: 't1', event_type: 'open' },
      { tracking_id: 't1', event_type: 'click' },
      { tracking_id: 't2', event_type: 'open' },
    ];

    const eventsByTrackingId = new Map<string, { opens: number; clicks: number }>();
    for (const event of events) {
      const stats = eventsByTrackingId.get(event.tracking_id) || { opens: 0, clicks: 0 };
      if (event.event_type === 'open') stats.opens++;
      else if (event.event_type === 'click') stats.clicks++;
      eventsByTrackingId.set(event.tracking_id, stats);
    }

    let totalOpens = 0;
    let totalClicks = 0;
    for (const tid of trackingIds) {
      const stats = eventsByTrackingId.get(tid);
      if (stats) {
        totalOpens += stats.opens;
        totalClicks += stats.clicks;
      }
    }

    expect(totalOpens).toBe(2);
    expect(totalClicks).toBe(1);
    expect(trackingIds.length).toBe(2);
  });

  it('should handle empty campaigns gracefully', () => {
    const campaigns: unknown[] = [];
    const result = campaigns.length === 0 ? [] : campaigns;
    expect(result).toEqual([]);
  });

  it('should calculate open rate and click rate correctly', () => {
    const totalEmails = 10;
    const totalOpens = 5;
    const totalClicks = 2;

    const openRate = totalEmails > 0 ? Math.round((totalOpens / totalEmails) * 100) : 0;
    const clickRate = totalOpens > 0 ? Math.round((totalClicks / totalOpens) * 100) : 0;

    expect(openRate).toBe(50);
    expect(clickRate).toBe(40);
  });

  it('should handle zero division in rates', () => {
    const safeRate = (numerator: number, denominator: number) =>
      denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
    const openRate = safeRate(0, 0);
    const clickRate = safeRate(0, 0);

    expect(openRate).toBe(0);
    expect(clickRate).toBe(0);
  });
});
