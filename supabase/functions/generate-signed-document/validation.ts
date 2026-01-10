import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const signedDocumentSchema = z.object({
  document_id: z.string().uuid(),
  user_id: z.string().uuid(),
  signer_name: z.string().min(2).max(100),
  signer_email: z.string().email(),
  signature_position: z.enum(["bottom", "top", "custom"]).optional().default("bottom"),
});

export type SignedDocumentRequest = z.infer<typeof signedDocumentSchema>;

export function validateSignedDocument(data: unknown) {
  return signedDocumentSchema.safeParse(data);
}
