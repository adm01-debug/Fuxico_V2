import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const trackPixelSchema = z.object({
  t: z.string().uuid(), // tracking_id as query param
});

export type TrackPixelRequest = z.infer<typeof trackPixelSchema>;

export function validateTrackPixel(data: unknown) {
  return trackPixelSchema.safeParse(data);
}
