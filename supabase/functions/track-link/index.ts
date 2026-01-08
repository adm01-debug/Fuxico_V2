import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('track-link')
const TrackLinkSchema = z.object({
  linkId: z.string().min(1),
  trackingId: z.string().min(1).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const rateLimit = await checkRateLimit(clientIP, "track-link", 100, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const url = new URL(req.url);
    const linkId = url.searchParams.get("l") || url.searchParams.get("linkId");
    const trackingId = url.searchParams.get("t") || url.searchParams.get("trackingId");

    const validation = TrackLinkSchema.safeParse({ linkId, trackingId });
    if (!validation.success || !linkId) {
      return secureErrorResponse("Invalid link", 400, corsHeaders);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Try to find by link_id first (UUID format from create-tracking), fallback to id
    let link = null;
    const { data: linkByLinkId } = await supabase.from("tracked_links").select("*").eq("link_id", linkId).single();
    
    if (linkByLinkId) {
      link = linkByLinkId;
    } else {
      // Fallback: try finding by id
      const { data: linkById } = await supabase.from("tracked_links").select("*").eq("id", linkId).single();
      link = linkById;
    }
    
    if (!link) return secureErrorResponse("Link not found", 404, corsHeaders);

    await supabase.from("tracking_events").insert({
      tracking_id: trackingId || link.tracking_id,
      event_type: "click",
      link_id: linkId,
      ip_address: clientIP,
      user_agent: userAgent,
      is_self_open: false
    });

    return Response.redirect(link.original_url, 302);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
