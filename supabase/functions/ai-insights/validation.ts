import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const aiInsightsRequestSchema = z.object({
  user_id: z.string().uuid(),
  email_ids: z.array(z.string().uuid()).optional(),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  insight_type: z.enum(["engagement", "trends", "recommendations"]).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export type AIInsightsRequest = z.infer<typeof aiInsightsRequestSchema>;

export function validateAIInsightsRequest(data: unknown) {
  return aiInsightsRequestSchema.safeParse(data);
}
