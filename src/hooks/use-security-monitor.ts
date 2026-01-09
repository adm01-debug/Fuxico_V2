/**
 * Vulnerability Monitoring Hook
 */

export function useSecurityMonitor() {
  const reportViolation = (violation: SecurityPolicyViolationEvent) => {
    fetch('/api/log-security-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'csp_violation',
        blockedUri: violation.blockedURI,
        violatedDirective: violation.violatedDirective,
        originalPolicy: violation.originalPolicy,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  };

  if (typeof window !== 'undefined') {
    document.addEventListener('securitypolicyviolation', reportViolation);
  }

  return { reportViolation };
}

export function monitorSuspiciousActivity(userId: string) {
  const activities: Array<{ action: string; timestamp: number }> = [];
  
  return {
    track: (action: string) => {
      activities.push({ action, timestamp: Date.now() });
      const recent = activities.filter(a => Date.now() - a.timestamp < 60000);
      if (recent.length > 50) {
        console.warn('[SECURITY] Suspicious activity detected:', userId);
      }
    },
  };
}
