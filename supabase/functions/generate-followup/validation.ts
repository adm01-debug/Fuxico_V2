import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const followupSchema = z.object({
  email_id: z.string().uuid(),
  user_id: z.string().uuid(),
  tone: z.enum(["professional", "friendly", "urgent"]).optional().default("professional"),
  include_original: z.boolean().optional().default(false),
  max_length: z.number().int().min(50).max(1000).optional().default(300),
});

export type FollowupRequest = z.infer<typeof followupSchema>;

export function validateFollowup(data: unknown) {
  return followupSchema.safeParse(data);
}
