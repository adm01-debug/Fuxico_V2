import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const zapierWebhookSchema = z.object({
  user_id: z.string().uuid(),
  trigger_type: z.string().min(1).max(100),
  data: z.record(z.unknown()),
  zap_id: z.string().optional(),
});

export type ZapierWebhookRequest = z.infer<typeof zapierWebhookSchema>;

export function validateZapierWebhook(data: unknown) {
  return zapierWebhookSchema.safeParse(data);
}
