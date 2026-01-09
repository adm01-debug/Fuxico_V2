import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const linkTrackSchema = z.object({ linkId: z.string(), trackingId: z.string(), url: z.string().url() });
