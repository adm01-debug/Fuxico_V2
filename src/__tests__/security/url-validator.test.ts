import { describe, it, expect } from 'vitest';

// Port the URL validator logic for testing (same logic as _shared/url-validator.ts)
const PRIVATE_IP_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./, /^::1$/, /^fc00:/i, /^fe80:/i,
];
const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal', '169.254.169.254', '[::1]'];

function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!['https:', 'http:'].includes(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) return false;
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) return false;
    }
    if (url.username || url.password) return false;
    return true;
  } catch { return false; }
}

describe('URL Validator - SSRF Prevention', () => {
  it('should allow valid public HTTPS URLs', () => {
    expect(isUrlSafe('https://example.com')).toBe(true);
    expect(isUrlSafe('https://api.stripe.com/v1/charges')).toBe(true);
  });

  it('should block localhost', () => {
    expect(isUrlSafe('http://localhost')).toBe(false);
    expect(isUrlSafe('http://localhost:8080')).toBe(false);
  });

  it('should block private IPs (RFC 1918)', () => {
    expect(isUrlSafe('http://10.0.0.1')).toBe(false);
    expect(isUrlSafe('http://172.16.0.1')).toBe(false);
    expect(isUrlSafe('http://192.168.1.1')).toBe(false);
  });

  it('should block AWS metadata endpoint', () => {
    expect(isUrlSafe('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('should block loopback', () => {
    expect(isUrlSafe('http://127.0.0.1')).toBe(false);
    expect(isUrlSafe('http://127.0.0.2')).toBe(false);
  });

  it('should block non-HTTP protocols', () => {
    expect(isUrlSafe('ftp://example.com')).toBe(false);
    expect(isUrlSafe('file:///etc/passwd')).toBe(false);
    expect(isUrlSafe('gopher://evil.com')).toBe(false);
  });

  it('should block URLs with credentials', () => {
    expect(isUrlSafe('http://admin:password@example.com')).toBe(false);
  });

  it('should handle invalid URLs', () => {
    expect(isUrlSafe('')).toBe(false);
    expect(isUrlSafe('not-a-url')).toBe(false);
  });
});
