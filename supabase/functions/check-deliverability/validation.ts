import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const deliverabilitySchema = z.object({
  email: z.string().email(),
  domain: z.string().optional(),
  check_mx: z.boolean().optional().default(true),
  check_smtp: z.boolean().optional().default(false),
});

export type DeliverabilityRequest = z.infer<typeof deliverabilitySchema>;

export function validateDeliverability(data: unknown) {
  return deliverabilitySchema.safeParse(data);
}
