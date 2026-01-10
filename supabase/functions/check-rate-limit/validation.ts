import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const rateLimitRequestSchema = z.object({
  user_id: z.string().uuid(),
  action: z.string().min(1).max(100),
  limit: z.number().int().positive().optional().default(100),
  window_seconds: z.number().int().positive().optional().default(3600),
});

export type RateLimitRequest = z.infer<typeof rateLimitRequestSchema>;

export function validateRateLimitRequest(data: unknown) {
  return rateLimitRequestSchema.safeParse(data);
}
