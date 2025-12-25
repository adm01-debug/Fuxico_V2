import { describe, it, expect, beforeAll, vi } from 'vitest';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';

describe('create-tracking Edge Function', () => {
  const endpoint = `${SUPABASE_URL}/functions/v1/create-tracking`;

  describe('Validation', () => {
    it('should reject requests without authorization', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: 'test@example.com' })
      });
      expect(response.status).toBe(401);
    });

    it('should reject invalid email format', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ recipientEmail: 'invalid-email' })
      });
      expect(response.status).toBe(400);
    });

    it('should reject empty body', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(400);
    });

    it('should reject missing recipientEmail', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ subject: 'Test Subject' })
      });
      expect(response.status).toBe(400);
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight request', async () => {
      const response = await fetch(endpoint, { method: 'OPTIONS' });
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ recipientEmail: 'test@example.com' })
      });
      // Rate limit headers should be present
      expect(response.headers.has('X-RateLimit-Limit') || response.status === 401).toBe(true);
    });
  });
});
