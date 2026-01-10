import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const verifyDomainSchema = z.object({
  user_id: z.string().uuid(),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/),
  verification_type: z.enum(["dns", "file", "meta"]).optional().default("dns"),
});

export type VerifyDomainRequest = z.infer<typeof verifyDomainSchema>;

export function validateVerifyDomain(data: unknown) {
  return verifyDomainSchema.safeParse(data);
}
