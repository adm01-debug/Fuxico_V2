import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const standaloneLinkSchema = z.object({ linkId: z.string(), destinationUrl: z.string().url() });
