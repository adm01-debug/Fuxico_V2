import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as securityMiddleware from '../../../supabase/functions/_shared/security-middleware.ts';
import * as ipWhitelist from '../../../supabase/functions/_shared/ip-whitelist.ts';

describe('Security Audit - Infrastructure Hardening', () => {
  it('should have Sentry and OTel initialized in App.tsx', () => {
    // Verificação estrutural: importar App.tsx arrasta o grafo inteiro da UI
    // (incluindo o client Supabase), o que torna o teste lento e dependente de env.
    const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    expect(appSource).toMatch(/from\s+["']@\/lib\/sentry["']/);
    expect(appSource).toMatch(/from\s+["']@\/lib\/otel["']/);
    expect(appSource).toMatch(/initSentry\s*\(\s*\)/);
    expect(appSource).toMatch(/initTracing\s*\(\s*\)/);
  });

  it('should have shared security middlewares', () => {
    expect(securityMiddleware.protectedHandler).toBeDefined();
    expect(securityMiddleware.publicHandler).toBeDefined();
    expect(ipWhitelist.validateIPAccess).toBeDefined();
  });
});
