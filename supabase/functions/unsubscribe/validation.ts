import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const unsubscribeSchema = z.object({
  email: z.string().email(),
  tracking_id: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
  feedback: z.string().max(1000).optional(),
});

export type UnsubscribeRequest = z.infer<typeof unsubscribeSchema>;

export function validateUnsubscribe(data: unknown) {
  return unsubscribeSchema.safeParse(data);
}
