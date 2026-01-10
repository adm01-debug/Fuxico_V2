import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const webhookDispatchSchema = z.object({
  user_id: z.string().uuid(),
  event_type: z.enum(["email.opened", "email.clicked", "email.bounced", "document.viewed"]),
  payload: z.record(z.unknown()),
  webhook_url: z.string().url().optional(),
  retry_count: z.number().int().min(0).max(5).optional().default(0),
});

export type WebhookDispatchRequest = z.infer<typeof webhookDispatchSchema>;

export function validateWebhookDispatch(data: unknown) {
  return webhookDispatchSchema.safeParse(data);
}
