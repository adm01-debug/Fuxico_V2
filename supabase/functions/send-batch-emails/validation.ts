import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const batchEmailSchema = z.object({
  user_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().max(100).optional(),
    variables: z.record(z.string()).optional(),
  })).min(1).max(500),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  schedule_at: z.string().datetime().optional(),
});

export type BatchEmailRequest = z.infer<typeof batchEmailSchema>;

export function validateBatchEmail(data: unknown) {
  return batchEmailSchema.safeParse(data);
}
