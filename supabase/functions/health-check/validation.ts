import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const healthCheckSchema = z.object({
  check_database: z.boolean().optional().default(true),
  check_storage: z.boolean().optional().default(false),
  timeout_ms: z.number().int().min(100).max(30000).optional().default(5000),
});

export type HealthCheckRequest = z.infer<typeof healthCheckSchema>;

export function validateHealthCheck(data: unknown) {
  return healthCheckSchema.safeParse(data);
}
