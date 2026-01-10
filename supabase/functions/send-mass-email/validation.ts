import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const massEmailSchema = z.object({
  user_id: z.string().uuid(),
  campaign_id: z.string().uuid().optional(),
  recipients: z.array(z.string().email()).min(1).max(10000),
  subject: z.string().min(1).max(500),
  html_body: z.string().min(1).max(100000),
  text_body: z.string().max(50000).optional(),
  track_opens: z.boolean().optional().default(true),
  track_clicks: z.boolean().optional().default(true),
});

export type MassEmailRequest = z.infer<typeof massEmailSchema>;

export function validateMassEmail(data: unknown) {
  return massEmailSchema.safeParse(data);
}
