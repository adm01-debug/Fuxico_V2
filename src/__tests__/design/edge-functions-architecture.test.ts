// =============================================================================
// FUXICO - Edge Functions Architecture Tests
// Validates all edge functions exist and have proper structure
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const functionsDir = path.resolve(__dirname, '../../../supabase/functions');

describe('Edge Functions - Existence', () => {
  const requiredFunctions = [
    'ai-insights', 'bitrix24-sync', 'check-deliverability', 'check-rate-limit',
    'cleanup-security-data', 'create-tracking', 'create-watermarked-pdf',
    'generate-delivery-certificate', 'generate-followup', 'generate-signed-document',
    'geo-lookup', 'get-config', 'get-tracking-stats', 'health-check',
    'log-email-activity', 'log-security-event', 'process-scheduled-reports',
    'process-sequences', 'report-bounce', 'send-batch-emails',
    'send-mail-merge', 'send-mass-email', 'send-push-notification',
    'send-signature-request', 'send-slack-notification', 'suggest-subject',
    'totp', 'track-beacon', 'track-document', 'track-link',
    'track-pixel', 'track-standalone-link', 'unsubscribe',
    'verify-custom-domain', 'vote-poll', 'webhook-dispatch',
    'webhook-sequences', 'zapier-webhook',
  ];

  requiredFunctions.forEach(fn => {
    it(`should have edge function '${fn}'`, () => {
      const fnPath = path.join(functionsDir, fn, 'index.ts');
      expect(fs.existsSync(fnPath)).toBe(true);
    });
  });
});

describe('Edge Functions - Shared Modules', () => {
  const sharedModules = ['cors.ts', 'logger.ts', 'rate-limit.ts', 'security-headers.ts'];

  sharedModules.forEach(mod => {
    it(`should have shared module '${mod}'`, () => {
      const modPath = path.join(functionsDir, '_shared', mod);
      expect(fs.existsSync(modPath)).toBe(true);
    });
  });
});

describe('Edge Functions - Deno Config', () => {
  it('should have deno.json configuration', () => {
    const denoJsonPath = path.join(functionsDir, 'deno.json');
    expect(fs.existsSync(denoJsonPath)).toBe(true);
  });
});
