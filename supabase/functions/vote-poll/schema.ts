import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'; export const voteSchema = z.object({ pollId: z.string().uuid(), optionId: z.string().uuid(), voterId: z.string().optional() });
