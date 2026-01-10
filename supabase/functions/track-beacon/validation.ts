import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const trackBeaconSchema = z.object({
  tracking_id: z.string().uuid(),
  event_type: z.enum(["open", "click", "scroll", "focus"]).optional().default("open"),
  metadata: z.record(z.unknown()).optional(),
});

export type TrackBeaconRequest = z.infer<typeof trackBeaconSchema>;

export function validateTrackBeacon(data: unknown) {
  return trackBeaconSchema.safeParse(data);
}
