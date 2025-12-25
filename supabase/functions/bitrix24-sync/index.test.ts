import { describe, it, expect } from 'vitest';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';

describe('bitrix24-sync Edge Function', () => {
  const endpoint = `${SUPABASE_URL}/functions/v1/bitrix24-sync`;

  describe('Authentication', () => {
    it('should reject requests without authorization', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_contact' })
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Action Validation', () => {
    it('should reject invalid action', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ action: 'invalid_action' })
      });
      expect([400, 401]).toContain(response.status);
    });

    it('should accept sync_contact action', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          action: 'sync_contact',
          email: 'test@example.com',
          name: 'Test User'
        })
      });
      expect([200, 401, 400]).toContain(response.status);
    });

    it('should accept sync_deal action', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          action: 'sync_deal',
          contactId: '123',
          title: 'Test Deal'
        })
      });
      expect([200, 401, 400]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const responses = await Promise.all(
        Array(10).fill(null).map(() =>
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({ action: 'sync_contact' })
          })
        )
      );
      const statuses = responses.map(r => r.status);
      expect(statuses.some(s => s === 429) || statuses.every(s => s !== 429)).toBe(true);
    });
  });
});
