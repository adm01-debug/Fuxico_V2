import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const pushNotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  icon: z.string().url().optional(),
  url: z.string().url().optional(),
  data: z.record(z.unknown()).optional(),
});

export type PushNotificationRequest = z.infer<typeof pushNotificationSchema>;

export function validatePushNotification(data: unknown) {
  return pushNotificationSchema.safeParse(data);
}
