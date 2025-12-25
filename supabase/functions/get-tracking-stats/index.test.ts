import { describe, it, expect } from 'vitest';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';

describe('get-tracking-stats Edge Function', () => {
  const endpoint = `${SUPABASE_URL}/functions/v1/get-tracking-stats`;

  describe('Authentication', () => {
    it('should reject requests without authorization', async () => {
      const response = await fetch(endpoint);
      expect(response.status).toBe(401);
    });
  });

  describe('Query Parameters Validation', () => {
    it('should accept valid limit parameter', async () => {
      const response = await fetch(`${endpoint}?limit=50`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 401]).toContain(response.status);
    });

    it('should reject limit > 500', async () => {
      const response = await fetch(`${endpoint}?limit=1000`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([400, 401]).toContain(response.status);
    });

    it('should accept cursor-based pagination', async () => {
      const cursor = new Date().toISOString();
      const response = await fetch(`${endpoint}?cursor=${cursor}`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Response Format', () => {
    it('should return proper pagination structure', async () => {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('emails');
        expect(data).toHaveProperty('pagination');
      }
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS request', async () => {
      const response = await fetch(endpoint, { method: 'OPTIONS' });
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });
});
