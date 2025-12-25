// =============================================================================
// FUXICO - Edge Functions Integration Tests
// Arquivo: supabase/functions/_tests/integration-suite.test.ts
// =============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Clientes
let anonClient: SupabaseClient;
let adminClient: SupabaseClient;

// Dados de teste
let testUserId: string;
let testTrackingId: string;
let testEmail = `test-${Date.now()}@example.com`;

describe('Edge Functions Integration Suite', () => {
  beforeAll(async () => {
    // Criar clientes Supabase
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Criar usuário de teste
    const { data: authData, error: authError } = await anonClient.auth.signUp({
      email: testEmail,
      password: 'test-password-123!',
    });

    if (authError) {
      console.error('Failed to create test user:', authError);
      throw authError;
    }

    testUserId = authData.user?.id || '';
    
    // Login
    await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: 'test-password-123!',
    });
  });

  afterAll(async () => {
    // Cleanup: Remover dados de teste
    if (testUserId) {
      await adminClient.from('tracked_emails').delete().eq('user_id', testUserId);
      await adminClient.from('tracking_events').delete().eq('user_id', testUserId);
      await adminClient.auth.admin.deleteUser(testUserId);
    }
  });

  // =========================================================================
  // CREATE-TRACKING
  // =========================================================================
  describe('create-tracking', () => {
    it('should create a new tracking entry with valid data', async () => {
      const response = await anonClient.functions.invoke('create-tracking', {
        body: {
          recipientEmail: 'recipient@example.com',
          subject: 'Test Email Subject',
          senderEmail: testEmail,
        },
      });

      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty('trackingId');
      expect(typeof response.data.trackingId).toBe('string');
      expect(response.data.trackingId.length).toBeGreaterThan(0);

      testTrackingId = response.data.trackingId;
    });

    it('should reject invalid email format', async () => {
      const response = await anonClient.functions.invoke('create-tracking', {
        body: {
          recipientEmail: 'invalid-email',
          subject: 'Test',
        },
      });

      expect(response.error).toBeDefined();
    });

    it('should reject empty subject', async () => {
      const response = await anonClient.functions.invoke('create-tracking', {
        body: {
          recipientEmail: 'valid@example.com',
          subject: '',
        },
      });

      expect(response.error).toBeDefined();
    });

    it('should handle metadata correctly', async () => {
      const metadata = { campaign: 'test', source: 'integration-test' };
      
      const response = await anonClient.functions.invoke('create-tracking', {
        body: {
          recipientEmail: 'recipient2@example.com',
          subject: 'Test with Metadata',
          metadata,
        },
      });

      expect(response.error).toBeNull();
      expect(response.data).toHaveProperty('trackingId');
    });
  });

  // =========================================================================
  // GET-TRACKING-STATS
  // =========================================================================
  describe('get-tracking-stats', () => {
    it('should return stats for authenticated user', async () => {
      const response = await anonClient.functions.invoke('get-tracking-stats', {
        body: { limit: 10 },
      });

      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.emails)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await anonClient.functions.invoke('get-tracking-stats', {
        body: { limit: 5 },
      });

      expect(response.error).toBeNull();
      expect(response.data.emails.length).toBeLessThanOrEqual(5);
    });

    it('should support cursor-based pagination', async () => {
      // Primeira página
      const page1 = await anonClient.functions.invoke('get-tracking-stats', {
        body: { limit: 2 },
      });

      expect(page1.error).toBeNull();
      
      if (page1.data.nextCursor) {
        // Segunda página
        const page2 = await anonClient.functions.invoke('get-tracking-stats', {
          body: { limit: 2, cursor: page1.data.nextCursor },
        });

        expect(page2.error).toBeNull();
        // Emails devem ser diferentes
        if (page1.data.emails.length > 0 && page2.data.emails.length > 0) {
          expect(page2.data.emails[0].id).not.toBe(page1.data.emails[0].id);
        }
      }
    });

    it('should reject unauthenticated requests', async () => {
      const unauthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      const response = await unauthClient.functions.invoke('get-tracking-stats', {
        body: {},
      });

      expect(response.error).toBeDefined();
    });
  });

  // =========================================================================
  // TRACK-PIXEL
  // =========================================================================
  describe('track-pixel', () => {
    it('should return a 1x1 transparent GIF', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/track-pixel?id=${testTrackingId}`
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/gif');
      
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should record open event', async () => {
      await fetch(`${SUPABASE_URL}/functions/v1/track-pixel?id=${testTrackingId}`);

      // Verificar se evento foi registrado
      const { data: events } = await adminClient
        .from('tracking_events')
        .select('*')
        .eq('tracking_id', testTrackingId)
        .eq('event_type', 'open');

      expect(events).toBeDefined();
      expect(events!.length).toBeGreaterThan(0);
    });

    it('should handle invalid tracking ID gracefully', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/track-pixel?id=invalid-id-12345`
      );

      // Deve retornar pixel mesmo com ID inválido (para não quebrar email)
      expect(response.status).toBe(200);
    });

    it('should set correct cache headers', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/track-pixel?id=${testTrackingId}`
      );

      expect(response.headers.get('cache-control')).toContain('no-cache');
    });
  });

  // =========================================================================
  // TRACK-LINK
  // =========================================================================
  describe('track-link', () => {
    let testLinkId: string;

    beforeAll(async () => {
      // Criar link de teste
      const { data } = await adminClient
        .from('tracked_links')
        .insert({
          tracking_id: testTrackingId,
          original_url: 'https://example.com/test',
          user_id: testUserId,
        })
        .select()
        .single();

      testLinkId = data?.id;
    });

    it('should redirect to original URL', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/track-link?id=${testLinkId}`,
        { redirect: 'manual' }
      );

      expect([301, 302, 307, 308]).toContain(response.status);
      expect(response.headers.get('location')).toBe('https://example.com/test');
    });

    it('should record click event', async () => {
      await fetch(`${SUPABASE_URL}/functions/v1/track-link?id=${testLinkId}`, {
        redirect: 'manual',
      });

      const { data: events } = await adminClient
        .from('tracking_events')
        .select('*')
        .eq('tracking_id', testTrackingId)
        .eq('event_type', 'click');

      expect(events).toBeDefined();
      expect(events!.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // RATE LIMITING
  // =========================================================================
  describe('rate-limiting', () => {
    it('should enforce rate limits on excessive requests', async () => {
      const requests = Array(35).fill(null).map(() =>
        anonClient.functions.invoke('get-tracking-stats', { body: { limit: 1 } })
      );

      const results = await Promise.all(requests);
      const rateLimited = results.filter(
        (r) => r.error?.message?.toLowerCase().includes('rate') ||
               r.data?.error?.toLowerCase().includes('rate')
      );

      // Deve haver pelo menos alguns requests limitados
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // WEBHOOK-DISPATCH
  // =========================================================================
  describe('webhook-dispatch', () => {
    it('should validate webhook payload schema', async () => {
      const response = await adminClient.functions.invoke('webhook-dispatch', {
        body: {
          // Payload inválido - faltando campos obrigatórios
          eventType: 'invalid',
        },
      });

      expect(response.error).toBeDefined();
    });

    it('should skip when no webhook configured', async () => {
      const response = await adminClient.functions.invoke('webhook-dispatch', {
        body: {
          userId: testUserId,
          eventType: 'email.opened',
          payload: { trackingId: testTrackingId },
        },
      });

      // Deve retornar sucesso mas com skip
      expect(response.error).toBeNull();
      expect(response.data?.skipped).toBe(true);
    });
  });

  // =========================================================================
  // GEO-LOOKUP
  // =========================================================================
  describe('geo-lookup', () => {
    it('should return geo data for valid IP', async () => {
      const response = await anonClient.functions.invoke('geo-lookup', {
        body: { ip: '8.8.8.8' },
      });

      expect(response.error).toBeNull();
      expect(response.data).toHaveProperty('country');
    });

    it('should handle private IPs gracefully', async () => {
      const response = await anonClient.functions.invoke('geo-lookup', {
        body: { ip: '192.168.1.1' },
      });

      // Deve retornar dados default ou erro amigável
      expect(response.error).toBeNull();
    });
  });

  // =========================================================================
  // HEALTH-CHECK
  // =========================================================================
  describe('health-check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/health-check`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data).toHaveProperty('checks');
    });
  });

  // =========================================================================
  // SECURITY HEADERS
  // =========================================================================
  describe('security-headers', () => {
    it('should include security headers in responses', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/health-check`);

      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
    });

    it('should have CORS headers configured', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, {
        method: 'OPTIONS',
      });

      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
      expect(response.headers.get('access-control-allow-methods')).toBeDefined();
    });
  });
});
