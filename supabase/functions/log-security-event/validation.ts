import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const securityEventSchema = z.object({
  user_id: z.string().uuid(),
  event_type: z.enum(["login", "logout", "failed_login", "password_change", "mfa_enabled", "suspicious_activity"]),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().default("low"),
});

export type SecurityEvent = z.infer<typeof securityEventSchema>;

export function validateSecurityEvent(data: unknown) {
  return securityEventSchema.safeParse(data);
}
