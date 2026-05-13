import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { CommonBeaconSchema } from "../_shared/schemas.ts";
import { publicHandler } from '../_shared/security-middleware.ts';

const BeaconSchema = CommonBeaconSchema;

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    
    const rateLimit = await checkRateLimit(clientIP, "beacon", 100, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    let body;
    if (req.method === "POST") {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      body = {
        trackingId: url.searchParams.get("t"),
        eventType: url.searchParams.get("e") || "open",
        metadata: {}
      };
    }

    const validation = BeaconSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Invalid beacon data" }, 400, corsHeaders);

    const { trackingId, eventType, metadata } = validation.data;

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    await supabase.from("tracking_events").insert({
      tracking_id: trackingId,
      event_type: eventType,
      ip_address: clientIP,
      user_agent: userAgent,
      metadata,
      is_self_open: false
    });

    return secureJsonResponse({ success: true }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(publicHandler(handler));
