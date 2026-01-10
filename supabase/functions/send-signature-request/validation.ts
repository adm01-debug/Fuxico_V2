import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const signatureRequestSchema = z.object({
  document_id: z.string().uuid(),
  user_id: z.string().uuid(),
  signer_email: z.string().email(),
  signer_name: z.string().min(2).max(100),
  message: z.string().max(1000).optional(),
  expires_in_days: z.number().int().min(1).max(90).optional().default(7),
});

export type SignatureRequestRequest = z.infer<typeof signatureRequestSchema>;

export function validateSignatureRequest(data: unknown) {
  return signatureRequestSchema.safeParse(data);
}
