import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const zapierSchema = z.object({ event: z.string().min(1), data: z.record(z.unknown()), zapId: z.string().optional() });
