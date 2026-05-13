import { z } from "zod";

export const securityEventSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  event_type: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  description: z.string(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  metadata: z.record(z.unknown()),
  created_at: z.string().datetime()
});

export type SecurityEvent = z.infer<typeof securityEventSchema>;
