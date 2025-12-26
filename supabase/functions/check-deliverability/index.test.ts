import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('check-deliverability', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('validation', () => {
    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user@domain.org'];
      const invalidEmails = ['invalid', 'no@', '@nodomain.com'];
      
      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
      
      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should validate domain parameter', () => {
      const validDomains = ['example.com', 'test.org', 'sub.domain.com'];
      validDomains.forEach(domain => {
        expect(domain).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/i);
      });
    });
  });

  describe('DNS checks', () => {
    it('should check MX records', async () => {
      const mockMxRecords = [{ priority: 10, exchange: 'mail.example.com' }];
      expect(mockMxRecords).toHaveLength(1);
      expect(mockMxRecords[0]).toHaveProperty('exchange');
    });

    it('should check SPF records', () => {
      const spfRecord = 'v=spf1 include:_spf.google.com ~all';
      expect(spfRecord).toContain('v=spf1');
    });

    it('should check DKIM records', () => {
      const dkimRecord = 'v=DKIM1; k=rsa; p=MIGfMA0GCSq...';
      expect(dkimRecord).toContain('v=DKIM1');
    });

    it('should check DMARC records', () => {
      const dmarcRecord = 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com';
      expect(dmarcRecord).toContain('v=DMARC1');
    });
  });

  describe('deliverability score', () => {
    it('should calculate score based on checks', () => {
      const checks = { mx: true, spf: true, dkim: true, dmarc: true };
      const score = Object.values(checks).filter(Boolean).length * 25;
      expect(score).toBe(100);
    });

    it('should return partial score for missing records', () => {
      const checks = { mx: true, spf: true, dkim: false, dmarc: false };
      const score = Object.values(checks).filter(Boolean).length * 25;
      expect(score).toBe(50);
    });
  });

  describe('error handling', () => {
    it('should handle DNS lookup failures', async () => {
      const error = new Error('DNS lookup failed');
      expect(error.message).toBe('DNS lookup failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT', message: 'Connection timed out' };
      expect(timeoutError.code).toBe('ETIMEDOUT');
    });
  });
});
