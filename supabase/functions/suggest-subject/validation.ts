import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const suggestSubjectSchema = z.object({
  user_id: z.string().uuid(),
  email_body: z.string().min(10).max(10000),
  tone: z.enum(["professional", "casual", "urgent", "friendly"]).optional().default("professional"),
  num_suggestions: z.number().int().min(1).max(10).optional().default(3),
});

export type SuggestSubjectRequest = z.infer<typeof suggestSubjectSchema>;

export function validateSuggestSubject(data: unknown) {
  return suggestSubjectSchema.safeParse(data);
}
