import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const mailMergeSchema = z.object({
  user_id: z.string().uuid(),
  template_id: z.string().uuid(),
  data_source: z.array(z.record(z.string())).min(1).max(1000),
  subject_template: z.string().min(1).max(500),
  send_immediately: z.boolean().optional().default(false),
});

export type MailMergeRequest = z.infer<typeof mailMergeSchema>;

export function validateMailMerge(data: unknown) {
  return mailMergeSchema.safeParse(data);
}
