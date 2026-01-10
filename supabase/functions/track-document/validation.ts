import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const trackDocumentSchema = z.object({
  document_id: z.string().uuid(),
  event_type: z.enum(["view", "download", "print", "share"]),
  page_number: z.number().int().min(1).optional(),
  time_spent_seconds: z.number().int().min(0).optional(),
});

export type TrackDocumentRequest = z.infer<typeof trackDocumentSchema>;

export function validateTrackDocument(data: unknown) {
  return trackDocumentSchema.safeParse(data);
}
