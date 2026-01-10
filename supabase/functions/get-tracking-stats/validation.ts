import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const trackingStatsSchema = z.object({
  user_id: z.string().uuid(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
  include_events: z.boolean().optional().default(true),
});

export type TrackingStatsRequest = z.infer<typeof trackingStatsSchema>;

export function validateTrackingStats(data: unknown) {
  return trackingStatsSchema.safeParse(data);
}
