import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const bitrix24SyncSchema = z.object({
  user_id: z.string().uuid(),
  action: z.enum(["sync_contacts", "sync_deals", "sync_activities", "full_sync"]),
  entity_ids: z.array(z.string()).optional(),
  force: z.boolean().optional().default(false),
});

export type Bitrix24SyncRequest = z.infer<typeof bitrix24SyncSchema>;

export function validateBitrix24Sync(data: unknown) {
  return bitrix24SyncSchema.safeParse(data);
}
