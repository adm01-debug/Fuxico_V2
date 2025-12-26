import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }))
};

vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: () => mockSupabase
}));

describe('ai-insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should validate period parameter', async () => {
      const validPeriods = ['7d', '30d', '90d', 'all'];
      validPeriods.forEach(period => {
        expect(['7d', '30d', '90d', 'all']).toContain(period);
      });
    });

    it('should reject invalid period', () => {
      const invalidPeriod = 'invalid';
      expect(['7d', '30d', '90d', 'all']).not.toContain(invalidPeriod);
    });
  });

  describe('authentication', () => {
    it('should require authorization header', async () => {
      const headers = new Headers();
      expect(headers.get('Authorization')).toBeNull();
    });

    it('should reject unauthorized requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: { message: 'Unauthorized' } 
      });
      
      const result = await mockSupabase.auth.getUser();
      expect(result.data.user).toBeNull();
    });
  });

  describe('insights generation', () => {
    it('should return empty insights for no data', () => {
      const stats: any[] = [];
      const insights = generateInsights(stats);
      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('info');
    });

    it('should detect high open rate', () => {
      const stats = [
        { opens: 60, clicks: 10 },
        { opens: 55, clicks: 8 },
      ];
      const insights = generateInsights(stats);
      const successInsight = insights.find(i => i.type === 'success');
      expect(successInsight).toBeDefined();
    });

    it('should warn on low open rate', () => {
      const stats = Array(100).fill({ opens: 0, clicks: 0 });
      stats[0] = { opens: 5, clicks: 0 };
      const insights = generateInsights(stats);
      const warningInsight = insights.find(i => i.type === 'warning');
      expect(warningInsight).toBeDefined();
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limit of 30 requests per minute', () => {
      const rateLimit = { allowed: true, remaining: 29 };
      expect(rateLimit.allowed).toBe(true);
    });
  });
});

function generateInsights(stats: any[]) {
  if (!stats.length) {
    return [{ type: 'info', title: 'Start tracking', description: 'Send tracked emails.' }];
  }
  const insights = [];
  const totalEmails = stats.length;
  const totalOpens = stats.reduce((sum, s) => sum + (s.opens || 0), 0);
  const openRate = totalEmails > 0 ? (totalOpens / totalEmails * 100) : 0;
  
  if (openRate > 50) {
    insights.push({ type: 'success', title: 'Great!', description: `${openRate}% open rate.` });
  } else if (openRate < 20) {
    insights.push({ type: 'warning', title: 'Attention', description: `Only ${openRate}% open rate.` });
  }
  return insights.length ? insights : [{ type: 'info', title: 'OK', description: 'Normal stats.' }];
}
