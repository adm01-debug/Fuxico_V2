import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';

const GeoSchema = z.object({
  ip: z.string().ip().optional()
});

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "geo", 60, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const url = new URL(req.url);
    const ipToLookup = url.searchParams.get("ip") || clientIP;

    const validation = GeoSchema.safeParse({ ip: ipToLookup });
    if (!validation.success && ipToLookup !== "unknown") {
      return secureErrorResponse({ error: "Invalid IP address" }, 400, corsHeaders);
    }

    const geoData = {
      ip: ipToLookup,
      country: "BR",
      countryName: "Brazil",
      region: "SP",
      regionName: "São Paulo",
      city: "São Paulo",
      zip: "01310-100",
      lat: -23.5505,
      lon: -46.6333,
      timezone: "America/Sao_Paulo",
      isp: "Unknown",
      org: "Unknown",
      as: "Unknown"
    };

    return secureJsonResponse(geoData, corsHeaders);
  } catch (_error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
