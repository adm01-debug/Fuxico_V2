import { describe, it, expect } from 'vitest';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';

describe('track-pixel Edge Function', () => {
  const endpoint = `${SUPABASE_URL}/functions/v1/track-pixel`;

  describe('Pixel Response', () => {
    it('should return transparent GIF', async () => {
      const response = await fetch(`${endpoint}?t=test-tracking-id`);
      expect(response.headers.get('Content-Type')).toBe('image/gif');
    });

    it('should return 1x1 pixel', async () => {
      const response = await fetch(`${endpoint}?t=test-tracking-id`);
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeLessThan(100);
    });

    it('should set no-cache headers', async () => {
      const response = await fetch(`${endpoint}?t=test-tracking-id`);
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-store');
    });
  });

  describe('Tracking ID Validation', () => {
    it('should accept valid tracking ID', async () => {
      const response = await fetch(`${endpoint}?t=valid-tracking-id`);
      expect(response.status).toBe(200);
    });

    it('should handle missing tracking ID gracefully', async () => {
      const response = await fetch(endpoint);
      expect(response.status).toBe(200); // Still returns pixel
    });
  });

  describe('CORS for Email Clients', () => {
    it('should allow any origin for email clients', async () => {
      const response = await fetch(`${endpoint}?t=test`, {
        headers: { 'Origin': 'https://mail.google.com' }
      });
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});
