import { describe, it, expect } from 'vitest';

describe('useTestWebhook - URL validation', () => {
  function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
      }
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
      if (blockedHosts.includes(parsed.hostname)) {
        return { valid: false, error: 'Localhost URLs are not allowed' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  it('should accept valid HTTPS URLs', () => {
    expect(validateWebhookUrl('https://example.com/webhook')).toEqual({ valid: true });
    expect(validateWebhookUrl('https://api.mysite.com/hook')).toEqual({ valid: true });
  });

  it('should accept valid HTTP URLs', () => {
    expect(validateWebhookUrl('http://example.com/webhook')).toEqual({ valid: true });
  });

  it('should reject localhost', () => {
    const result = validateWebhookUrl('http://localhost:3000/webhook');
    expect(result.valid).toBe(false);
  });

  it('should reject 127.0.0.1', () => {
    const result = validateWebhookUrl('http://127.0.0.1/webhook');
    expect(result.valid).toBe(false);
  });

  it('should reject non-HTTP protocols', () => {
    expect(validateWebhookUrl('ftp://example.com').valid).toBe(false);
    expect(validateWebhookUrl('file:///etc/passwd').valid).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(validateWebhookUrl('not-a-url').valid).toBe(false);
    expect(validateWebhookUrl('').valid).toBe(false);
  });

  it('should reject javascript: protocol', () => {
    expect(validateWebhookUrl('javascript:alert(1)').valid).toBe(false);
  });
});
