import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const GeoLookupSchema = z.object({
  ip: z.string().optional(),
  trackingId: z.string().optional(),
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(clientIP, "geo-lookup", 60, 60);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const validatedData = GeoLookupSchema.parse(body);
    
    const ipToLookup = validatedData.ip || clientIP;

    // Use ip-api.com for geo lookup (free tier)
    const geoResponse = await fetch(`http://ip-api.com/json/${ipToLookup}`);
    const geoData = await geoResponse.json();

    return new Response(JSON.stringify({
      ip: ipToLookup,
      country: geoData.country,
      countryCode: geoData.countryCode,
      region: geoData.regionName,
      city: geoData.city,
      lat: geoData.lat,
      lon: geoData.lon,
      timezone: geoData.timezone,
      isp: geoData.isp,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Validation error", details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
