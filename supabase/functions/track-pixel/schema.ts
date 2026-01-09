import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const pixelSchema = z.object({ trackingId: z.string().min(1) });
