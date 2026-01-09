import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const healthSchema = z.object({ services: z.array(z.string()).optional() });
