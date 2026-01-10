import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const reportBounceSchema = z.object({
  tracking_id: z.string().uuid(),
  bounce_type: z.enum(["hard", "soft", "complaint", "unsubscribe"]),
  bounce_reason: z.string().max(500).optional(),
  original_recipient: z.string().email().optional(),
});

export type ReportBounceRequest = z.infer<typeof reportBounceSchema>;

export function validateReportBounce(data: unknown) {
  return reportBounceSchema.safeParse(data);
}
