import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const emailActivitySchema = z.object({
  user_id: z.string().uuid(),
  email_id: z.string().uuid().optional(),
  activity_type: z.enum(["sent", "received", "forwarded", "replied", "archived"]),
  direction: z.enum(["inbound", "outbound"]),
  metadata: z.record(z.unknown()).optional(),
});

export type EmailActivityRequest = z.infer<typeof emailActivitySchema>;

export function validateEmailActivity(data: unknown) {
  return emailActivitySchema.safeParse(data);
}
