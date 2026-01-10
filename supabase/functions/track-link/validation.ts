import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const trackLinkSchema = z.object({
  link_id: z.string().uuid(),
  tracking_id: z.string().uuid().optional(),
  redirect_url: z.string().url().optional(),
});

export type TrackLinkRequest = z.infer<typeof trackLinkSchema>;

export function validateTrackLink(data: unknown) {
  return trackLinkSchema.safeParse(data);
}
