import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const domainSchema = z.object({ domain: z.string().min(1), verificationType: z.enum(['dns', 'file', 'meta']) });
