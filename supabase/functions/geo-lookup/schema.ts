import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const geoSchema = z.object({ ip: z.string().ip() });
