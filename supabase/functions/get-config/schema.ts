import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const configSchema = z.object({ userId: z.string().uuid().optional(), keys: z.array(z.string()).optional() });
