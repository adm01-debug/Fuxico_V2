import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const standaloneTrackSchema = z.object({
  link_id: z.string().uuid(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
});

export type StandaloneTrackRequest = z.infer<typeof standaloneTrackSchema>;

export function validateStandaloneTrack(data: unknown) {
  return standaloneTrackSchema.safeParse(data);
}
