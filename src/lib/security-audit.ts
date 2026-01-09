/**
 * Security Audit Logger
 */

interface AuditEvent {
  type: string;
  userId?: string;
  action: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function logSecurityEvent(event: Omit<AuditEvent, 'timestamp'>): void {
  const auditEvent: AuditEvent = { ...event, timestamp: new Date().toISOString() };
  
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/log-security-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditEvent),
    }).catch(console.error);
  } else {
    console.log('[AUDIT]', auditEvent);
  }
}

export const SecurityEvents = {
  LOGIN_SUCCESS: 'login.success',
  LOGIN_FAILED: 'login.failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password.change',
  PERMISSION_DENIED: 'permission.denied',
  SUSPICIOUS_ACTIVITY: 'suspicious.activity',
} as const;
