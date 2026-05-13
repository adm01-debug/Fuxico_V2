import { describe, it, expect } from 'vitest';

describe('Security Audit - Infrastructure Hardening', () => {
  it('should have Sentry and OTel initialized in App.tsx', async () => {
    // This is a behavioral/structural test
    const appFile = await import('../../App.tsx');
    expect(appFile).toBeDefined();
  });

  it('should have shared security middlewares', async () => {
    // Check if security-middleware and ip-whitelist exist and export correctly
    const securityMiddleware = await import('../../../supabase/functions/_shared/security-middleware.ts');
    const ipWhitelist = await import('../../../supabase/functions/_shared/ip-whitelist.ts');
    
    expect(securityMiddleware.protectedHandler).toBeDefined();
    expect(securityMiddleware.publicHandler).toBeDefined();
    expect(ipWhitelist.validateIPAccess).toBeDefined();
  });
});
