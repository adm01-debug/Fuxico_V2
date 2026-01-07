import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { validateIPAccess } from '../_shared/ip-whitelist.ts';
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('geo-lookup');

const GeoSchema = z.object({
  ip: z.string().ip().optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
