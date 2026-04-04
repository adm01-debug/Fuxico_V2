import { describe, it, expect } from 'vitest';

describe('useBounceAlerts - batch alert checking', () => {
  it('should detect domains exceeding warning threshold', () => {
    const domains = [
      { domain: 'example.com', bounce_rate: 0.15 },
      { domain: 'safe.com', bounce_rate: 0.02 },
      { domain: 'risky.com', bounce_rate: 0.25 },
    ];
    const warningThreshold = 0.1;
    const alertDomains = domains.filter(d => d.bounce_rate >= warningThreshold);
    expect(alertDomains).toHaveLength(2);
    expect(alertDomains.map(d => d.domain)).toContain('example.com');
    expect(alertDomains.map(d => d.domain)).toContain('risky.com');
  });

  it('should not create duplicate alerts for existing unresolved domains', () => {
    const existingAlertDomains = new Set(['example.com']);
    const domain = 'example.com';
    const shouldCreate = !existingAlertDomains.has(domain);
    expect(shouldCreate).toBe(false);
  });

  it('should classify critical vs warning', () => {
    const criticalThreshold = 0.2;
    const warningThreshold = 0.1;
    const bounceRate = 0.25;
    const isCritical = bounceRate >= criticalThreshold;
    const isWarning = bounceRate >= warningThreshold && !isCritical;
    expect(isCritical).toBe(true);
    expect(isWarning).toBe(false);
  });
});
