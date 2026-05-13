import { z } from "zod";

export const emailAuditLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_email: z.string().email(),
  direction: z.enum(['sent', 'received']),
  recipient_email: z.string().email().nullable(),
  sender_email: z.string().email().nullable(),
  subject: z.string().nullable(),
  timestamp: z.string().datetime(),
  is_external: z.boolean(),
  external_domain: z.string().nullable(),
  metadata: z.record(z.unknown()),
  created_at: z.string().datetime()
});

export const fraudAlertSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_email: z.string().email(),
  alert_type: z.enum(['suspicious_hours', 'external_recipient', 'volume_anomaly']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  email_audit_log_id: z.string().uuid().nullable(),
  is_resolved: z.boolean(),
  resolved_by: z.string().uuid().nullable(),
  resolved_at: z.string().datetime().nullable(),
  metadata: z.record(z.unknown()),
  created_at: z.string().datetime()
});

export type EmailAuditLog = z.infer<typeof emailAuditLogSchema>;
export type FraudAlert = z.infer<typeof fraudAlertSchema>;
