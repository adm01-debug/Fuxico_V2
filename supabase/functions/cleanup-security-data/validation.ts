import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const cleanupRequestSchema = z.object({
  user_id: z.string().uuid().optional(),
  days_old: z.number().int().min(1).max(365).optional().default(30),
  data_types: z.array(z.enum(["logs", "events", "alerts"])).optional(),
  dry_run: z.boolean().optional().default(false),
});

export type CleanupRequest = z.infer<typeof cleanupRequestSchema>;

export function validateCleanupRequest(data: unknown) {
  return cleanupRequestSchema.safeParse(data);
}
