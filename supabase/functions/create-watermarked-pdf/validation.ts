import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const watermarkedPdfSchema = z.object({
  document_id: z.string().uuid(),
  user_id: z.string().uuid(),
  watermark_text: z.string().min(1).max(200).optional(),
  watermark_opacity: z.number().min(0.1).max(1).optional().default(0.3),
  include_timestamp: z.boolean().optional().default(true),
});

export type WatermarkedPdfRequest = z.infer<typeof watermarkedPdfSchema>;

export function validateWatermarkedPdf(data: unknown) {
  return watermarkedPdfSchema.safeParse(data);
}
