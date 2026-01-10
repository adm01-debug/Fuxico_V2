import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const slackNotificationSchema = z.object({
  user_id: z.string().uuid(),
  channel: z.string().min(1).max(100),
  message: z.string().min(1).max(4000),
  attachments: z.array(z.record(z.unknown())).optional(),
  thread_ts: z.string().optional(),
});

export type SlackNotificationRequest = z.infer<typeof slackNotificationSchema>;

export function validateSlackNotification(data: unknown) {
  return slackNotificationSchema.safeParse(data);
}
