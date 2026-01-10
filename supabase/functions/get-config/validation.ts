import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const getConfigSchema = z.object({
  user_id: z.string().uuid().optional(),
  config_keys: z.array(z.string().min(1).max(100)).optional(),
  include_defaults: z.boolean().optional().default(true),
});

export type GetConfigRequest = z.infer<typeof getConfigSchema>;

export function validateGetConfig(data: unknown) {
  return getConfigSchema.safeParse(data);
}
