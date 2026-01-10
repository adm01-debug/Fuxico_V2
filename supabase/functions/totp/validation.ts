import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const totpGenerateSchema = z.object({
  user_id: z.string().uuid(),
  issuer: z.string().min(1).max(50).optional().default("FUXICO"),
});

export const totpVerifySchema = z.object({
  user_id: z.string().uuid(),
  token: z.string().length(6).regex(/^\d+$/),
  secret: z.string().min(16).max(64).optional(),
});

export type TOTPGenerate = z.infer<typeof totpGenerateSchema>;
export type TOTPVerify = z.infer<typeof totpVerifySchema>;

export function validateTOTPGenerate(data: unknown) {
  return totpGenerateSchema.safeParse(data);
}

export function validateTOTPVerify(data: unknown) {
  return totpVerifySchema.safeParse(data);
}
