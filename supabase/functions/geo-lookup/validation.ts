import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const geoLookupSchema = z.object({
  ip_address: z.string().ip(),
  include_timezone: z.boolean().optional().default(true),
  include_isp: z.boolean().optional().default(false),
});

export type GeoLookupRequest = z.infer<typeof geoLookupSchema>;

export function validateGeoLookup(data: unknown) {
  return geoLookupSchema.safeParse(data);
}
