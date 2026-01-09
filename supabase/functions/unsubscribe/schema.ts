import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const unsubscribeSchema = z.object({ trackingId: z.string(), email: z.string().email().optional(), reason: z.string().optional() });
