import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const createTrackingSchema = z.object({
  recipient_email: z.string().email(),
  subject: z.string().min(1).max(500),
  sender_email: z.string().email().optional(),
  metadata: z.record(z.unknown()).optional(),
  track_opens: z.boolean().optional().default(true),
  track_clicks: z.boolean().optional().default(true),
});

export type CreateTrackingRequest = z.infer<typeof createTrackingSchema>;

export function validateCreateTracking(data: unknown) {
  return createTrackingSchema.safeParse(data);
}
