import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const deliveryCertificateSchema = z.object({
  email_id: z.string().uuid(),
  user_id: z.string().uuid(),
  include_events: z.boolean().optional().default(true),
  format: z.enum(["pdf", "html"]).optional().default("pdf"),
});

export type DeliveryCertificateRequest = z.infer<typeof deliveryCertificateSchema>;

export function validateDeliveryCertificate(data: unknown) {
  return deliveryCertificateSchema.safeParse(data);
}
